"use client";

import { useEffect, useState } from "react";
import { EVENT } from "@/lib/constants";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(target: number): TimeLeft {
  const diff = Math.max(0, target - Date.now());
  const seconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

const UNITS: { key: keyof TimeLeft; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Mins" },
  { key: "seconds", label: "Secs" },
];

export default function Countdown() {
  const target = new Date(EVENT.dateISO).getTime();
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    // Compute on mount only to avoid SSR/CSR hydration mismatch.
    setTime(getTimeLeft(target));
    const id = setInterval(() => setTime(getTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const isLive = time !== null;
  const isOver =
    isLive &&
    time.days === 0 &&
    time.hours === 0 &&
    time.minutes === 0 &&
    time.seconds === 0;

  if (isOver) {
    return (
      <div className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur">
        <span aria-hidden>🎉</span> The event is here — see you at the start line!
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-4 gap-2.5 sm:gap-4"
      role="timer"
      aria-label="Countdown to event"
    >
      {UNITS.map(({ key, label }) => (
        <div
          key={key}
          className="flex flex-col items-center rounded-2xl bg-white/15 px-2 py-3 text-white ring-1 ring-white/25 backdrop-blur sm:px-4 sm:py-4"
        >
          <span className="font-mono text-2xl font-black tabular-nums sm:text-4xl">
            {isLive ? String(time[key]).padStart(2, "0") : "--"}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/70 sm:text-xs">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
