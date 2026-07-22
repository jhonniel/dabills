import { cookies } from "next/headers";

import type { Payment, PaymentReceipt } from "@/types";
import type { OcrValidationResult } from "@/services/ocr/validate";

export type DemoPaymentRecord = Payment & {
  subscription_name?: string | null;
  due_date?: string | null;
  receipt?: PaymentReceipt | null;
  validation?: OcrValidationResult | null;
};

const DEMO_PAYMENTS_COOKIE = "dabills_demo_payments";

export async function readDemoPayments(): Promise<DemoPaymentRecord[]> {
  const store = await cookies();
  const raw = store.get(DEMO_PAYMENTS_COOKIE)?.value;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as DemoPaymentRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeDemoPayments(items: DemoPaymentRecord[]) {
  const store = await cookies();
  // Keep payload lean — strip large preview blobs before cookie write
  const lean = items.map((item) => ({
    ...item,
    receipt: item.receipt
      ? {
          ...item.receipt,
          ocr_raw: item.receipt.ocr_raw
            ? { provider: (item.receipt.ocr_raw as { provider?: string }).provider }
            : null,
        }
      : null,
  }));

  store.set(DEMO_PAYMENTS_COOKIE, encodeURIComponent(JSON.stringify(lean)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function createDemoPayment(record: DemoPaymentRecord) {
  const items = await readDemoPayments();
  await writeDemoPayments([record, ...items]);
  return record;
}

export async function updateDemoPayment(
  id: string,
  patch: Partial<DemoPaymentRecord>
) {
  const items = await readDemoPayments();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const updated = {
    ...items[index],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  const next = [...items];
  next[index] = updated;
  await writeDemoPayments(next);
  return updated;
}

export async function getDemoPayment(id: string) {
  const items = await readDemoPayments();
  return items.find((item) => item.id === id) ?? null;
}
