"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { parseScannedToken } from "@/lib/qr";

const NAME_KEY = "citaacc:volunteerName";
const READER_ID = "qr-reader";

type AttendanceStatus = "NOT_CHECKED_IN" | "PRESENT";
type TshirtStatus = "PENDING" | "DISTRIBUTED";

interface Participant {
  id: string;
  token: string;
  bibNumber: string | number;
  fullName: string;
  category: "ADULT" | "KID";
  age: number;
  gender: string;
  tshirtSize: string;
  attendanceStatus: AttendanceStatus;
  attendanceAt: string | null;
  attendanceVolunteer: string | null;
  tshirtStatus: TshirtStatus;
  tshirtAt: string | null;
  tshirtVolunteer: string | null;
  registration: {
    regCode: string;
    fullName: string;
    mobile: string;
    email: string;
    paymentStatus: string;
  };
}

export default function VolunteerScanner() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);

  const [volunteer, setVolunteer] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const [manualInput, setManualInput] = useState("");
  const [participant, setParticipant] = useState<Participant | null>(null);

  const [loading, setLoading] = useState(false);
  const [actionPending, setActionPending] = useState<"attendance" | "tshirt" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Load stored volunteer name.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(NAME_KEY) ?? "";
      setVolunteer(stored);
      if (!stored) {
        setEditingName(true);
        setNameDraft("");
      }
    } catch {
      setEditingName(true);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    const inst = scannerRef.current;
    if (!inst) return;
    try {
      // Only stop if actively scanning to avoid html5-qrcode throwing.
      await inst.stop();
    } catch {
      // ignore — scanner may already be stopped
    }
    try {
      inst.clear();
    } catch {
      // ignore
    }
    scannerRef.current = null;
    setScanning(false);
  }, []);

  // Clean up the camera on unmount.
  useEffect(() => {
    return () => {
      const inst = scannerRef.current;
      if (inst) {
        inst.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const lookupToken = useCallback(async (rawToken: string) => {
    const token = parseScannedToken(rawToken);
    if (!token) {
      setError("That doesn't look like a valid pass. Please scan or enter a valid QR/token.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/participant/${encodeURIComponent(token)}`);
      if (res.status === 404) {
        setError("No participant found for this pass.");
        setParticipant(null);
        return;
      }
      if (!res.ok) {
        setError("Could not look up this pass. Please try again.");
        return;
      }
      const data: Participant = await res.json();
      setParticipant(data);
    } catch {
      setError("Network error while looking up the pass. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    setNotice(null);
    setParticipant(null);
    setScanning(true);

    // Defer so the #qr-reader div is mounted.
    await new Promise((r) => setTimeout(r, 0));

    try {
      const inst = new Html5Qrcode(READER_ID);
      scannerRef.current = inst;
      await inst.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          // Stop first so we don't fire multiple lookups.
          await stopScanner();
          await lookupToken(decodedText);
        },
        () => {
          // per-frame decode failures are normal; ignore.
        }
      );
    } catch (err) {
      scannerRef.current = null;
      setScanning(false);
      const msg = err instanceof Error ? err.message : String(err);
      if (/permission|NotAllowed|denied/i.test(msg)) {
        setError(
          "Camera permission was denied. Please allow camera access in your browser settings, or use manual entry below."
        );
      } else if (/NotFound|no camera|requested device/i.test(msg)) {
        setError("No camera was found on this device. Please use manual entry below.");
      } else {
        setError("Could not start the camera. Please use manual entry below.");
      }
    }
  }, [lookupToken, stopScanner]);

  function saveName() {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }
    setVolunteer(trimmed);
    try {
      window.localStorage.setItem(NAME_KEY, trimmed);
    } catch {
      // ignore storage failures
    }
    setEditingName(false);
    setError(null);
  }

  async function runAction(kind: "attendance" | "tshirt") {
    if (!participant) return;
    if (!volunteer.trim()) {
      setEditingName(true);
      setNameDraft("");
      setError("Please set your name before marking actions.");
      return;
    }

    setActionPending(kind);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: participant.token, volunteer: volunteer.trim() }),
      });

      if (res.status === 401) {
        setError("Your session has expired. Please sign in again.");
        return;
      }
      if (!res.ok) {
        setError("Action failed. Please try again.");
        return;
      }

      const data = await res.json();
      const label = kind === "attendance" ? "Attendance" : "T-shirt";

      if (data.alreadyDone) {
        setNotice(
          kind === "attendance"
            ? "Already checked in."
            : "T-shirt already marked as distributed."
        );
      } else {
        setNotice(`${label} marked successfully.`);
      }

      // Reflect new statuses locally.
      setParticipant((prev) => {
        if (!prev) return prev;
        if (kind === "attendance") {
          return {
            ...prev,
            attendanceStatus: "PRESENT",
            attendanceAt: data.attendanceAt ?? prev.attendanceAt ?? new Date().toISOString(),
            attendanceVolunteer: data.attendanceVolunteer ?? volunteer.trim(),
          };
        }
        return {
          ...prev,
          tshirtStatus: "DISTRIBUTED",
          tshirtAt: data.tshirtAt ?? prev.tshirtAt ?? new Date().toISOString(),
          tshirtVolunteer: data.tshirtVolunteer ?? volunteer.trim(),
        };
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setActionPending(null);
    }
  }

  async function scanNext() {
    setParticipant(null);
    setError(null);
    setNotice(null);
    setManualInput("");
    await startScanner();
  }

  async function handleManualLookup(e: React.FormEvent) {
    e.preventDefault();
    await stopScanner();
    await lookupToken(manualInput);
  }

  async function logout() {
    await stopScanner();
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "volunteer" }),
      });
    } catch {
      // ignore — refresh will reflect server state
    }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      {/* Volunteer identity */}
      <div className="card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Scanning as
            </p>
            {editingName ? (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  className="field py-2"
                  placeholder="Your name"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  autoFocus
                />
                <button type="button" className="btn-primary px-4 py-2" onClick={saveName}>
                  Save
                </button>
              </div>
            ) : (
              <p className="mt-0.5 truncate text-lg font-semibold text-slate-900">
                {volunteer || "Unknown volunteer"}
              </p>
            )}
          </div>
          {!editingName && (
            <button
              type="button"
              className="shrink-0 text-sm font-medium text-brand-600 hover:underline"
              onClick={() => {
                setNameDraft(volunteer);
                setEditingName(true);
              }}
            >
              Edit
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-4 w-full rounded-xl px-4 py-2 text-sm font-medium text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          Log out
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200"
        >
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
          {notice}
        </div>
      )}

      {/* Scanner / lookup — hidden while a participant is loaded */}
      {!participant && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Scan a pass</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Point the camera at a participant&apos;s QR code.
            </p>
          </div>

          {/* Camera viewport */}
          <div
            id={READER_ID}
            className={`overflow-hidden rounded-2xl bg-slate-900 ${
              scanning ? "block" : "hidden"
            }`}
          />

          {scanning ? (
            <button
              type="button"
              className="btn-ghost w-full py-3.5 text-base"
              onClick={stopScanner}
            >
              Stop camera
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary w-full py-3.5 text-base"
              onClick={startScanner}
              disabled={loading}
            >
              {loading ? "Loading…" : "Start camera"}
            </button>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            OR
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleManualLookup} className="space-y-3">
            <div>
              <label htmlFor="manual-token" className="label">
                Enter bib number, or paste a pass link
              </label>
              <input
                id="manual-token"
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                className="field"
                placeholder="e.g. CITAACC-0023 (or 23), or a pass link"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn-accent w-full py-3.5 text-base"
              disabled={loading || !manualInput.trim()}
            >
              {loading ? "Looking up…" : "Look up"}
            </button>
          </form>
        </div>
      )}

      {/* Result card */}
      {participant && (
        <div className="card space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Bib #{String(participant.bibNumber)}
              </p>
              <h2 className="truncate text-xl font-bold text-slate-900">
                {participant.fullName}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Reg {participant.registration.regCode}
              </p>
            </div>
            <span
              className={`chip shrink-0 ${
                participant.category === "ADULT"
                  ? "bg-brand-100 text-brand-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {participant.category === "ADULT" ? "Adult" : "Kid"}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <dt className="text-xs text-slate-400">T-Shirt Size</dt>
              <dd className="font-semibold text-slate-900">{participant.tshirtSize}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <dt className="text-xs text-slate-400">Age / Gender</dt>
              <dd className="font-semibold text-slate-900">
                {participant.age} · {participant.gender}
              </dd>
            </div>
          </dl>

          {/* Statuses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <span className="text-sm font-medium text-slate-600">Attendance</span>
              <span
                className={`chip ${
                  participant.attendanceStatus === "PRESENT"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {participant.attendanceStatus === "PRESENT" ? "Present" : "Not checked in"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <span className="text-sm font-medium text-slate-600">T-Shirt</span>
              <span
                className={`chip ${
                  participant.tshirtStatus === "DISTRIBUTED"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {participant.tshirtStatus === "DISTRIBUTED" ? "Distributed" : "Pending"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="button"
              className="btn-primary w-full py-4 text-base"
              onClick={() => runAction("attendance")}
              disabled={actionPending !== null || participant.attendanceStatus === "PRESENT"}
            >
              {actionPending === "attendance"
                ? "Marking…"
                : participant.attendanceStatus === "PRESENT"
                ? "✓ Checked in"
                : "Mark Attendance"}
            </button>
            <button
              type="button"
              className="btn-accent w-full py-4 text-base"
              onClick={() => runAction("tshirt")}
              disabled={actionPending !== null || participant.tshirtStatus === "DISTRIBUTED"}
            >
              {actionPending === "tshirt"
                ? "Marking…"
                : participant.tshirtStatus === "DISTRIBUTED"
                ? "✓ T-Shirt given"
                : "Mark T-Shirt Distributed"}
            </button>
            <button
              type="button"
              className="btn-ghost w-full py-3.5 text-base"
              onClick={scanNext}
            >
              Scan next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
