import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { qrDataUrl, qrContentForToken } from "@/lib/qr";
import { EVENT } from "@/lib/constants";
import PassCard from "@/components/PassCard";
import PassActions from "@/components/PassActions";

export const metadata: Metadata = {
  title: `Event Pass — ${EVENT.shortName}`,
  description: `Digital event pass for ${EVENT.name}.`,
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PassPage({ params }: PageProps) {
  const { token } = await params;

  const participant = await prisma.participant.findUnique({
    where: { qrToken: token },
    include: { registration: true },
  });

  if (!participant) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="container-x flex min-h-screen flex-col items-center justify-center py-16">
          <div className="card w-full max-w-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
              🔍
            </div>
            <h1 className="mt-4 text-xl font-bold text-slate-900">Pass not found</h1>
            <p className="mt-2 text-sm text-slate-600">
              We couldn&apos;t find an event pass for this link. The code may be incorrect or the
              registration may no longer exist.
            </p>
            <Link href="/" className="btn-primary mt-6 w-full">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const dataUrl = await qrDataUrl(token);
  const passUrl = qrContentForToken(token);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 print:bg-white">
      <style>{`
        @media print {
          body { background: #ffffff !important; }
          .pass-no-print { display: none !important; }
          .pass-actions { display: none !important; }
          .pass-print-target {
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { margin: 12mm; }
        }
      `}</style>

      <div className="container-x py-8 sm:py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="pass-no-print mb-5 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <span aria-hidden>←</span> Home
            </Link>
            <span
              className={`chip ${
                participant.registration.paymentStatus === "PAID"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {participant.registration.paymentStatus === "PAID" ? "Confirmed" : "Payment Pending"}
            </span>
          </div>

          <PassCard
            qrDataUrl={dataUrl}
            fullName={participant.fullName}
            bibNumber={participant.bibNumber}
            category={participant.category}
            tshirtSize={participant.tshirtSize}
            age={participant.age}
            gender={participant.gender}
            regCode={participant.registration.regCode}
            payerName={participant.registration.fullName}
            attendanceStatus={participant.attendanceStatus}
            tshirtStatus={participant.tshirtStatus}
            passUrl={passUrl}
          />

          <div className="pass-no-print">
            <PassActions passUrl={passUrl} />
            <p className="mt-4 text-center text-xs text-slate-400">
              Save this pass to your phone or print it. Each participant has a unique QR code.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
