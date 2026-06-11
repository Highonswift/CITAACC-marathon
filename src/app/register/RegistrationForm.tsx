"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ADULT_TSHIRT_SIZES,
  CHENNAI_ZONES,
  DEPARTMENTS,
  GENDERS,
  KID_TSHIRT_SIZES,
  MEMBERSHIP_OPTIONS,
} from "@/lib/constants";
import { computeTotal, formatINR, type Category } from "@/lib/pricing";

type Participant = {
  uid: string;
  category: Category;
  fullName: string;
  age: string;
  gender: string;
  tshirtSize: string;
};

type Details = {
  fullName: string;
  email: string;
  mobile: string;
  membership: string;
  batchYear: string;
  department: string;
  chennaiZone: string;
  addressLine1: string;
  area: string;
  city: string;
  pincode: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  medicalConditions: string;
};

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (resp: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

const MOBILE_RE = /^[6-9]\d{9}$/;
const PIN_RE = /^\d{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function emptyParticipant(category: Category, uid: string): Participant {
  return {
    uid,
    category,
    fullName: "",
    age: "",
    gender: "",
    tshirtSize: "",
  };
}

const initialDetails: Details = {
  fullName: "",
  email: "",
  mobile: "",
  membership: MEMBERSHIP_OPTIONS[0].value,
  batchYear: "",
  department: "",
  chennaiZone: "",
  addressLine1: "",
  area: "",
  city: "",
  pincode: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  medicalConditions: "",
};

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RegistrationForm() {
  const router = useRouter();

  // Stable, SSR-safe unique ids for participant cards (avoids hydration mismatch).
  const baseId = useId();
  const uidRef = useRef(0);
  const newUid = () => `${baseId}-p${(uidRef.current += 1)}`;

  const [details, setDetails] = useState<Details>(initialDetails);
  const [participants, setParticipants] = useState<Participant[]>(() => [
    emptyParticipant("ADULT", `${baseId}-p0`),
  ]);
  const [healthDeclaration, setHealthDeclaration] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const { total, adults, kids } = useMemo(
    () => computeTotal(participants.map((p) => ({ category: p.category }))),
    [participants]
  );

  function setField<K extends keyof Details>(key: K, value: Details[K]) {
    setDetails((d) => ({ ...d, [key]: value }));
  }

  function updateParticipant(uid: string, patch: Partial<Participant>) {
    setParticipants((list) =>
      list.map((p) => (p.uid === uid ? { ...p, ...patch } : p))
    );
  }

  function setCategory(uid: string, category: Category) {
    // Reset T-shirt size since the option lists differ between adult & kid.
    updateParticipant(uid, { category, tshirtSize: "" });
  }

  function addParticipant() {
    setParticipants((list) => [...list, emptyParticipant("ADULT", newUid())]);
  }

  function removeParticipant(uid: string) {
    setParticipants((list) =>
      list.length > 1 ? list.filter((p) => p.uid !== uid) : list
    );
  }

  function validate(): string | null {
    if (!details.fullName.trim()) return "Please enter your full name.";
    if (!EMAIL_RE.test(details.email.trim())) return "Please enter a valid email address.";
    if (!MOBILE_RE.test(details.mobile.trim()))
      return "Enter a valid 10-digit mobile number starting 6–9.";
    if (!details.membership) return "Please select your membership type.";
    const yr = Number(details.batchYear);
    if (!details.batchYear.trim() || !Number.isInteger(yr) || yr < 1900 || yr > 2100)
      return "Please enter a valid CIT batch year.";
    if (!details.department) return "Please select your department.";
    if (!details.addressLine1.trim()) return "Please enter your address.";
    if (!details.area.trim()) return "Please enter your area / locality.";
    if (!details.city.trim()) return "Please enter your city.";
    if (!PIN_RE.test(details.pincode.trim())) return "Pincode must be 6 digits.";
    if (!details.emergencyContactName.trim())
      return "Please enter an emergency contact name.";
    if (!MOBILE_RE.test(details.emergencyContactNumber.trim()))
      return "Enter a valid 10-digit emergency contact number.";

    if (participants.length < 1) return "Add at least one participant.";
    for (let i = 0; i < participants.length; i += 1) {
      const p = participants[i];
      const n = i + 1;
      if (!p.fullName.trim()) return `Participant ${n}: enter a full name.`;
      const age = Number(p.age);
      if (!p.age.trim() || !Number.isInteger(age) || age < 0 || age > 120)
        return `Participant ${n}: enter a valid age.`;
      if (!p.gender) return `Participant ${n}: select a gender.`;
      if (!p.tshirtSize) return `Participant ${n}: select a T-shirt size.`;
    }

    if (!healthDeclaration) return "Please accept the health declaration.";
    if (!photoConsent) return "Please accept the photography & communication consent.";
    return null;
  }

  function buildPayload() {
    return {
      fullName: details.fullName.trim(),
      email: details.email.trim(),
      mobile: details.mobile.trim(),
      membership: details.membership,
      batchYear: Number(details.batchYear),
      department: details.department,
      chennaiZone: details.chennaiZone || undefined,
      addressLine1: details.addressLine1.trim(),
      area: details.area.trim(),
      city: details.city.trim(),
      pincode: details.pincode.trim(),
      emergencyContactName: details.emergencyContactName.trim(),
      emergencyContactNumber: details.emergencyContactNumber.trim(),
      medicalConditions: details.medicalConditions.trim() || undefined,
      healthDeclaration: true as const,
      photoConsent: true as const,
      participants: participants.map((p) => ({
        category: p.category,
        fullName: p.fullName.trim(),
        age: Number(p.age),
        gender: p.gender,
        tshirtSize: p.tshirtSize,
      })),
    };
  }

  function openReview() {
    setAttempted(true);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setReviewOpen(true);
  }

  async function handlePay() {
    const err = validate();
    if (err) {
      setError(err);
      setReviewOpen(false);
      setAttempted(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          (data && (data.error || data.message)) ||
            "We couldn't create your registration. Please review your details and try again."
        );
      }

      const data: {
        regId: string;
        order: {
          orderId: string;
          amount: number;
          currency: string;
          keyId: string;
          mock: boolean;
        };
        prefill: { name: string; email: string; contact: string };
      } = await res.json();

      const verify = async (payload: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const vres = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ regId: data.regId, ...payload }),
        });
        if (!vres.ok) {
          const vdata = await vres.json().catch(() => null);
          throw new Error(
            (vdata && (vdata.error || vdata.message)) ||
              "Payment verification failed. If you were charged, please contact us."
          );
        }
        const vbody: {
          regCode: string;
          participants: Array<{
            id: string;
            fullName: string;
            bibNumber: string;
            token: string;
            category: Category;
            tshirtSize: string;
          }>;
        } = await vres.json();

        sessionStorage.setItem(
          "citaacc:lastReg",
          JSON.stringify({ regCode: vbody.regCode, participants: vbody.participants })
        );
        router.push("/register/success");
      };

      if (data.order.mock) {
        await verify({
          razorpay_order_id: data.order.orderId,
          razorpay_payment_id: "mock_payment",
          razorpay_signature: "mock_signature",
        });
        return;
      }

      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) {
        throw new Error("Unable to load the payment gateway. Please try again.");
      }

      const rzp = new window.Razorpay({
        key: data.order.keyId,
        order_id: data.order.orderId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "CITAACC 5K",
        description: "Event Registration",
        prefill: data.prefill,
        theme: { color: "#1b4cf5" },
        handler: (resp) => {
          verify({
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          }).catch((e) => {
            setError(e instanceof Error ? e.message : "Payment verification failed.");
            setSubmitting(false);
          });
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setError("Payment was cancelled. You can try again when ready.");
          },
        },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const sizeOptions = (category: Category) =>
    category === "ADULT" ? ADULT_TSHIRT_SIZES : KID_TSHIRT_SIZES;

  return (
    <div className="container-x mt-6 space-y-6">
      {/* SECTION 1 — Your Details */}
      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">1 · Your Details</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Used for T-shirt distribution &amp; alumni records.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="fullName">
              Full Name *
            </label>
            <input
              id="fullName"
              className="field"
              autoComplete="name"
              value={details.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email *
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              className="field"
              autoComplete="email"
              value={details.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="label" htmlFor="mobile">
              Mobile *
            </label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 px-3 text-base text-slate-600">
                +91
              </span>
              <input
                id="mobile"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className="field rounded-l-none"
                autoComplete="tel-national"
                value={details.mobile}
                onChange={(e) =>
                  setField("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="10-digit number"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <span className="label">Membership *</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {MEMBERSHIP_OPTIONS.map((opt) => {
                const active = details.membership === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      active
                        ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
                        : "border-slate-300 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="membership"
                      className="h-4 w-4 accent-brand-600"
                      checked={active}
                      onChange={() => setField("membership", opt.value)}
                    />
                    <span className="font-medium text-slate-800">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="batchYear">
              CIT Batch Year *
            </label>
            <input
              id="batchYear"
              type="number"
              inputMode="numeric"
              className="field"
              min={1900}
              max={2100}
              value={details.batchYear}
              onChange={(e) => setField("batchYear", e.target.value)}
              placeholder="e.g. 2008"
            />
          </div>

          <div>
            <label className="label" htmlFor="department">
              Department *
            </label>
            <select
              id="department"
              className="field"
              value={details.department}
              onChange={(e) => setField("department", e.target.value)}
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="chennaiZone">
              Chennai Zone
            </label>
            <select
              id="chennaiZone"
              className="field"
              value={details.chennaiZone}
              onChange={(e) => setField("chennaiZone", e.target.value)}
            >
              <option value="">Select zone (optional)</option>
              {CHENNAI_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="addressLine1">
              Address Line 1 *
            </label>
            <input
              id="addressLine1"
              className="field"
              autoComplete="address-line1"
              value={details.addressLine1}
              onChange={(e) => setField("addressLine1", e.target.value)}
              placeholder="House / Flat, Street"
            />
          </div>

          <div>
            <label className="label" htmlFor="area">
              Area / Locality *
            </label>
            <input
              id="area"
              className="field"
              value={details.area}
              onChange={(e) => setField("area", e.target.value)}
              placeholder="e.g. Velachery"
            />
          </div>

          <div>
            <label className="label" htmlFor="city">
              City *
            </label>
            <input
              id="city"
              className="field"
              autoComplete="address-level2"
              value={details.city}
              onChange={(e) => setField("city", e.target.value)}
              placeholder="e.g. Chennai"
            />
          </div>

          <div>
            <label className="label" htmlFor="pincode">
              Pincode *
            </label>
            <input
              id="pincode"
              type="tel"
              inputMode="numeric"
              maxLength={6}
              className="field"
              autoComplete="postal-code"
              value={details.pincode}
              onChange={(e) =>
                setField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="6-digit pincode"
            />
          </div>
        </div>
      </section>

      {/* SECTION 2 — Participants */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">2 · Participants</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Add everyone walking with you, including yourself — adults and kids
            </p>
          </div>
          <span className="chip bg-slate-100 text-slate-600">
            {participants.length} added
          </span>
        </div>

        <div className="space-y-4">
          {participants.map((p, idx) => (
            <div
              key={p.uid}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  Participant {idx + 1}
                </span>
                {participants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeParticipant(p.uid)}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Category segmented toggle */}
              <div className="mb-4">
                <span className="label">Category *</span>
                <div className="grid grid-cols-2 gap-2">
                  {(["ADULT", "KID"] as Category[]).map((cat) => {
                    const active = p.category === cat;
                    const price = cat === "ADULT" ? 500 : 200;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(p.uid, cat)}
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                          active
                            ? "border-brand-500 bg-brand-600 text-white shadow-sm"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {cat === "ADULT" ? "Adult" : "Kid"} · {formatINR(price)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label" htmlFor={`pname-${p.uid}`}>
                    Full Name *
                  </label>
                  <input
                    id={`pname-${p.uid}`}
                    className="field"
                    value={p.fullName}
                    onChange={(e) =>
                      updateParticipant(p.uid, { fullName: e.target.value })
                    }
                    placeholder="Participant name"
                  />
                </div>

                <div>
                  <label className="label" htmlFor={`page-${p.uid}`}>
                    Age *
                  </label>
                  <input
                    id={`page-${p.uid}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={120}
                    className="field"
                    value={p.age}
                    onChange={(e) =>
                      updateParticipant(p.uid, {
                        age: e.target.value.replace(/\D/g, "").slice(0, 3),
                      })
                    }
                    placeholder="Age"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Kid: Age &lt; 18 years
                  </p>
                </div>

                <div>
                  <label className="label" htmlFor={`pgender-${p.uid}`}>
                    Gender *
                  </label>
                  <select
                    id={`pgender-${p.uid}`}
                    className="field"
                    value={p.gender}
                    onChange={(e) =>
                      updateParticipant(p.uid, { gender: e.target.value })
                    }
                  >
                    <option value="">Select</option>
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="label" htmlFor={`psize-${p.uid}`}>
                    T-Shirt Size *
                  </label>
                  <select
                    id={`psize-${p.uid}`}
                    className="field"
                    value={p.tshirtSize}
                    onChange={(e) =>
                      updateParticipant(p.uid, { tshirtSize: e.target.value })
                    }
                  >
                    <option value="">Select size</option>
                    {sizeOptions(p.category).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addParticipant}
          className="btn-ghost w-full"
        >
          <span aria-hidden>+</span> Add Participant
        </button>
      </section>

      {/* SECTION 3 — Safety & Health */}
      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">3 · Safety &amp; Health</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            So our medical team can support you on event day.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="emName">
              Emergency Contact Name *
            </label>
            <input
              id="emName"
              className="field"
              value={details.emergencyContactName}
              onChange={(e) => setField("emergencyContactName", e.target.value)}
              placeholder="Contact person"
            />
          </div>

          <div>
            <label className="label" htmlFor="emNumber">
              Emergency Contact Number *
            </label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 px-3 text-base text-slate-600">
                +91
              </span>
              <input
                id="emNumber"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className="field rounded-l-none"
                value={details.emergencyContactNumber}
                onChange={(e) =>
                  setField(
                    "emergencyContactNumber",
                    e.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
                placeholder="10-digit number"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="medical">
              Medical Conditions / Allergies
            </label>
            <textarea
              id="medical"
              className="field min-h-[88px] resize-y"
              value={details.medicalConditions}
              onChange={(e) => setField("medicalConditions", e.target.value)}
              placeholder="e.g. Asthma, Diabetes, Allergy, None"
            />
          </div>
        </div>
      </section>

      {/* SECTION 4 — Consent */}
      <section className="card space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">4 · Consent</h2>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 accent-brand-600"
            checked={healthDeclaration}
            onChange={(e) => setHealthDeclaration(e.target.checked)}
          />
          <span className="text-sm text-slate-700">
            I confirm all registered participants are medically fit to take part in the
            walk/jog, and I take responsibility for their participation. *
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 accent-brand-600"
            checked={photoConsent}
            onChange={(e) => setPhotoConsent(e.target.checked)}
          />
          <span className="text-sm text-slate-700">
            I consent to event photography &amp; videography, and to receiving event-related
            communication from the organizers. *
          </span>
        </label>
      </section>

      {/* Fee summary (in-flow, full detail) */}
      <section className="card">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Fee Summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-slate-600">
            <dt>
              Adults <span className="text-slate-400">× {adults}</span>
            </dt>
            <dd>{formatINR(adults * 500)}</dd>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <dt>
              Kids <span className="text-slate-400">× {kids}</span>
            </dt>
            <dd>{formatINR(kids * 200)}</dd>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
            <dt>Total</dt>
            <dd>{formatINR(total)}</dd>
          </div>
        </dl>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {attempted && !error && (
        <p className="text-xs text-slate-400">
          All fields marked * are required.
        </p>
      )}

      {/* Desktop review button */}
      <div className="hidden sm:block">
        <button
          type="button"
          onClick={openReview}
          disabled={submitting}
          className="btn-accent w-full"
        >
          Review &amp; Pay · {formatINR(total)}
        </button>
      </div>

      {/* Sticky mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-lg font-bold text-slate-900">{formatINR(total)}</p>
          </div>
          <button
            type="button"
            onClick={openReview}
            disabled={submitting}
            className="btn-accent flex-1"
          >
            Review &amp; Pay
          </button>
        </div>
      </div>

      {/* REVIEW modal */}
      {reviewOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Review your registration"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Review &amp; Confirm</h3>
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close review"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{details.fullName}</p>
                <p className="text-slate-600">{details.email}</p>
                <p className="text-slate-600">+91 {details.mobile}</p>
                <p className="mt-1 text-slate-500">
                  CIT {details.batchYear} · {details.department}
                  {details.chennaiZone ? ` · ${details.chennaiZone}` : ""}
                </p>
                <p className="text-slate-500">
                  {details.addressLine1}, {details.area}, {details.city} -{" "}
                  {details.pincode}
                </p>
              </div>

              <div>
                <p className="mb-2 font-semibold text-slate-900">
                  Participants ({participants.length})
                </p>
                <ul className="space-y-2">
                  {participants.map((p, idx) => (
                    <li
                      key={p.uid}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <span>
                        <span className="font-medium text-slate-800">
                          {p.fullName || `Participant ${idx + 1}`}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {p.category === "ADULT" ? "Adult" : "Kid"} · Age {p.age} · Size{" "}
                          {p.tshirtSize}
                        </span>
                      </span>
                      <span className="font-semibold text-slate-700">
                        {formatINR(p.category === "ADULT" ? 500 : 200)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1 rounded-xl bg-brand-50 p-4">
                <div className="flex justify-between text-slate-600">
                  <span>Adults × {adults}</span>
                  <span>{formatINR(adults * 500)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Kids × {kids}</span>
                  <span>{formatINR(kids * 200)}</span>
                </div>
                <div className="flex justify-between border-t border-brand-200 pt-2 text-base font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatINR(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                disabled={submitting}
                className="btn-ghost flex-1"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? "Processing…" : `Pay ${formatINR(total)}`}
              </button>
            </div>

            <p className="mt-3 text-center text-xs text-slate-400">
              Secure payment · You&apos;ll get a digital pass for each participant.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
