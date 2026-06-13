import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/auth";

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) lines.push(row.map(csvEscape).join(","));
  return lines.join("\n");
}

export async function GET(req: Request) {
  if (!(await hasRole("admin"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const type = new URL(req.url).searchParams.get("type") || "registrations";
  let filename = `${type}.csv`;
  let csv = "";

  if (type === "registrations") {
    const regs = await prisma.registration.findMany({
      include: { _count: { select: { participants: true } } },
      orderBy: { createdAt: "asc" },
    });
    csv = toCsv(
      [
        "Reg Code", "Name", "Email", "Mobile", "Membership", "Batch", "Department",
        "City", "Pincode", "Participants", "Amount", "Payment", "Created",
      ],
      regs.map((r) => [
        r.regCode, r.fullName, r.email, r.mobile, r.membership, r.batchYear,
        r.department, r.city, r.pincode, r._count.participants,
        r.totalAmount, r.paymentStatus, r.createdAt.toISOString(),
      ])
    );
  } else if (type === "participants" || type === "attendance" || type === "tshirt") {
    const parts = await prisma.participant.findMany({
      include: { registration: true },
      orderBy: { bibNumber: "asc" },
    });
    csv = toCsv(
      [
        "Bib", "Name", "Category", "Age", "Gender", "T-Shirt Size", "Reg Code",
        "Payer", "Mobile", "Attendance", "Attendance At", "Attendance By",
        "T-Shirt Status", "T-Shirt At", "T-Shirt By",
      ],
      parts.map((p) => [
        p.bibNumber, p.fullName, p.category, p.age, p.gender, p.tshirtSize,
        p.registration.regCode, p.registration.fullName, p.registration.mobile,
        p.attendanceStatus,
        p.attendanceAt?.toISOString() || "", p.attendanceVolunteer || "",
        p.tshirtStatus, p.tshirtAt?.toISOString() || "", p.tshirtVolunteer || "",
      ])
    );
  } else if (type === "revenue") {
    const regs = await prisma.registration.findMany({
      where: { paymentStatus: "PAID" },
      orderBy: { paidAt: "asc" },
    });
    csv = toCsv(
      ["Reg Code", "Name", "Amount", "Razorpay Payment", "Paid At"],
      regs.map((r) => [
        r.regCode, r.fullName, r.totalAmount, r.razorpayPaymentId || "",
        r.paidAt?.toISOString() || "",
      ])
    );
  } else {
    return new Response("Unknown export type", { status: 400 });
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
