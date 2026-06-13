import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/lib/validation";
import { computeTotal, priceFor } from "@/lib/pricing";
import { nextCounter, formatRegCode, formatBibNumber } from "@/lib/counters";
import { createOrder } from "@/lib/razorpay";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }
  const data = parsed.data;

  // Always compute the amount on the server — never trust the client total.
  const { total } = computeTotal(data.participants);

  // Create the registration + participants atomically, assigning the reg code
  // and sequential bib numbers from the Counter table.
  const registration = await prisma.$transaction(async (tx) => {
    const regSeq = await nextCounter(tx, "registration");
    const regCode = formatRegCode(regSeq);

    const reg = await tx.registration.create({
      data: {
        regCode,
        fullName: data.fullName,
        email: data.email,
        mobile: data.mobile,
        membership: data.membership,
        batchYear: data.batchYear,
        department: data.department,
        addressLine1: data.addressLine1,
        area: data.area,
        city: data.city,
        pincode: data.pincode,
        emergencyContactName: data.emergencyContactName,
        emergencyContactNumber: data.emergencyContactNumber,
        medicalConditions: data.medicalConditions || null,
        healthDeclaration: data.healthDeclaration,
        photoConsent: data.photoConsent,
        totalAmount: total,
        paymentStatus: "PENDING",
      },
    });

    for (const p of data.participants) {
      const bibSeq = await nextCounter(tx, "bib");
      await tx.participant.create({
        data: {
          registrationId: reg.id,
          bibNumber: formatBibNumber(bibSeq),
          category: p.category,
          fullName: p.fullName,
          age: p.age,
          gender: p.gender,
          tshirtSize: p.tshirtSize,
          price: priceFor(p.category),
        },
      });
    }

    return reg;
  });

  // Create the Razorpay order (or a mock order when keys are absent).
  const order = await createOrder(total, registration.regCode);

  await prisma.registration.update({
    where: { id: registration.id },
    data: { razorpayOrderId: order.orderId },
  });

  return NextResponse.json({
    regId: registration.id,
    regCode: registration.regCode,
    total,
    order,
    prefill: {
      name: data.fullName,
      email: data.email,
      contact: data.mobile,
    },
  });
}
