import { PRICING } from "./constants";

export type Category = "ADULT" | "KID";

export function priceFor(category: Category): number {
  return category === "ADULT" ? PRICING.ADULT : PRICING.KID;
}

export function computeTotal(
  participants: { category: Category }[]
): { total: number; adults: number; kids: number } {
  let total = 0;
  let adults = 0;
  let kids = 0;
  for (const p of participants) {
    total += priceFor(p.category);
    if (p.category === "ADULT") adults += 1;
    else kids += 1;
  }
  return { total, adults, kids };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
