import crypto from "crypto";
import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID || "";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

// When Razorpay keys are not configured we run in MOCK mode so the full
// registration flow remains testable locally without real charges.
export const isMockPayment = !keyId || !keySecret;

let client: Razorpay | null = null;
if (!isMockPayment) {
  client = new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export interface CreatedOrder {
  orderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
  mock: boolean;
}

export async function createOrder(
  amountInRupees: number,
  receipt: string
): Promise<CreatedOrder> {
  const amount = amountInRupees * 100; // Razorpay works in paise

  if (isMockPayment || !client) {
    return {
      orderId: `mock_order_${receipt}_${amount}`,
      amount,
      currency: "INR",
      keyId: "mock",
      mock: true,
    };
  }

  const order = await client.orders.create({
    amount,
    currency: "INR",
    receipt,
    notes: { event: "CITAACC 5K 2026" },
  });

  return {
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    keyId,
    mock: false,
  };
}

export interface VerifyInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export function verifySignature({ orderId, paymentId, signature }: VerifyInput): boolean {
  // Mock orders auto-verify so local testing can complete the flow.
  if (isMockPayment || orderId.startsWith("mock_order_")) {
    return true;
  }
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return timingSafeEqual(expected, signature);
}

// ----- Webhook verification (server-to-server, the reliable source of truth) -----

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
export const hasWebhookSecret = !!webhookSecret;

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!webhookSecret) return false;
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
