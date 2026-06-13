import { PrismaClient } from "@prisma/client";
import { formatRegCode, formatBibNumber } from "../src/lib/counters";

const prisma = new PrismaClient();

const DEPTS = ["CSE", "ECE", "EEE", "Mechanical", "IT", "MCA", "MBA"];
const ADULT_SIZES = ["S", "M", "L", "XL", "XXL"];
const KID_SIZES = ["6-7 Yrs", "8-9 Yrs", "10-11 Yrs", "Adult XS"];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

async function main() {
  console.log("Resetting demo data…");
  await prisma.participant.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.counter.deleteMany();

  let regSeq = 0;
  let bibSeq = 0;

  const families = [
    { name: "Ragul Krishnan", kids: 2, adults: 2 },
    { name: "Sampath Kumar", kids: 1, adults: 2 },
    { name: "Priya Raman", kids: 0, adults: 1 },
    { name: "Anand Subramanian", kids: 2, adults: 1 },
    { name: "Deepa Venkat", kids: 1, adults: 2 },
    { name: "Karthik Mohan", kids: 0, adults: 2 },
    { name: "Lakshmi Narayanan", kids: 3, adults: 2 },
    { name: "Vijay Sekar", kids: 0, adults: 1 },
  ];

  for (let i = 0; i < families.length; i++) {
    const f = families[i];
    regSeq += 1;
    const paid = i < 6; // first 6 paid, last 2 pending
    const total = f.adults * 500 + f.kids * 200;

    const reg = await prisma.registration.create({
      data: {
        regCode: formatRegCode(regSeq),
        fullName: f.name,
        email: `${f.name.split(" ")[0].toLowerCase()}@example.com`,
        mobile: `98${String(40000000 + i * 11111).slice(0, 8)}`,
        membership: i % 3 === 0 ? "FAMILY_OR_SPOUSE" : "LIFETIME_MEMBER",
        batchYear: 2005 + (i % 15),
        department: pick(DEPTS, i),
        addressLine1: `${10 + i}, Gandhi Street`,
        area: "Anna Nagar",
        city: "Chennai",
        pincode: `6000${String(10 + i).slice(0, 2)}`,
        emergencyContactName: "Family Member",
        emergencyContactNumber: "9000000000",
        medicalConditions: i % 4 === 0 ? "None" : null,
        healthDeclaration: true,
        photoConsent: true,
        totalAmount: total,
        paymentStatus: paid ? "PAID" : "PENDING",
        paidAt: paid ? new Date("2026-06-01T10:00:00Z") : null,
        razorpayPaymentId: paid ? `pay_demo_${i}` : null,
      },
    });

    const make = async (cat: "ADULT" | "KID", n: number) => {
      for (let j = 0; j < n; j++) {
        bibSeq += 1;
        const present = paid && (bibSeq % 3 !== 0);
        const distributed = present && bibSeq % 2 === 0;
        await prisma.participant.create({
          data: {
            registrationId: reg.id,
            bibNumber: formatBibNumber(bibSeq),
            category: cat,
            fullName: `${f.name.split(" ")[0]} ${cat === "KID" ? "Jr " : ""}${j + 1}`,
            age: cat === "ADULT" ? 28 + j * 3 : 6 + j * 2,
            gender: j % 2 === 0 ? "MALE" : "FEMALE",
            tshirtSize: cat === "ADULT" ? pick(ADULT_SIZES, bibSeq) : pick(KID_SIZES, bibSeq),
            price: cat === "ADULT" ? 500 : 200,
            attendanceStatus: present ? "PRESENT" : "NOT_CHECKED_IN",
            attendanceAt: present ? new Date("2026-08-09T01:30:00Z") : null,
            attendanceVolunteer: present ? "Volunteer A" : null,
            tshirtStatus: distributed ? "DISTRIBUTED" : "PENDING",
            tshirtAt: distributed ? new Date("2026-08-09T01:35:00Z") : null,
            tshirtVolunteer: distributed ? "Volunteer B" : null,
          },
        });
      }
    };

    await make("ADULT", f.adults);
    await make("KID", f.kids);
  }

  // Keep counters in sync so new registrations continue the sequence.
  await prisma.counter.createMany({
    data: [
      { name: "registration", value: regSeq },
      { name: "bib", value: bibSeq },
    ],
  });

  console.log(`Seeded ${families.length} registrations, ${bibSeq} participants.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
