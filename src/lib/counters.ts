import { Prisma } from "@prisma/client";

// Atomically increments a named counter inside a transaction and returns the new value.
// Uses an upsert + update to guarantee uniqueness even under concurrent registrations.
export async function nextCounter(
  tx: Prisma.TransactionClient,
  name: string
): Promise<number> {
  const row = await tx.counter.upsert({
    where: { name },
    create: { name, value: 1 },
    update: { value: { increment: 1 } },
  });
  return row.value;
}

export function formatRegCode(n: number): string {
  return `REG2026-${String(n).padStart(3, "0")}`;
}

export function formatBibNumber(n: number): string {
  return `CITAACC-${String(n).padStart(4, "0")}`;
}
