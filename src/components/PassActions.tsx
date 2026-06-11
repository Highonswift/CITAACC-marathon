"use client";

import { useState } from "react";

interface PassActionsProps {
  passUrl: string;
}

export default function PassActions({ passUrl }: PassActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(passUrl);
      } else {
        const el = document.createElement("textarea");
        el.value = passUrl;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="pass-actions mt-6 flex flex-col gap-3 sm:flex-row">
      <button type="button" onClick={handlePrint} className="btn-primary w-full sm:flex-1">
        <span aria-hidden>⬇️</span>
        Download / Print PDF
      </button>
      <button type="button" onClick={handleCopy} className="btn-ghost w-full sm:flex-1">
        <span aria-hidden>{copied ? "✓" : "🔗"}</span>
        {copied ? "Link Copied!" : "Copy Pass Link"}
      </button>
    </div>
  );
}
