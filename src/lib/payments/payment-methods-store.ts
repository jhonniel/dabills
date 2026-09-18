import { cookies } from "next/headers";

import type { PaymentMethod } from "@/types";

const METHODS_COOKIE = "dabills_demo_payment_methods_v2";

function seedMethods(): PaymentMethod[] {
  const now = new Date().toISOString();
  return [
    {
      id: "pm-gcash",
      channel: "GCash",
      account_name: "DaBills Payments",
      account_number: "0917 000 0000",
      instructions: "Send the exact bill amount. Use your bill name as the message.",
      qr_image_url: null,
      is_active: true,
      sort_order: 1,
      created_by: "demo-admin",
      created_at: now,
      updated_at: now,
    },
    {
      id: "pm-maya",
      channel: "Maya",
      account_name: "DaBills Payments",
      account_number: "0918 111 2222",
      instructions: "Include the payment reference from the settle form.",
      qr_image_url: null,
      is_active: true,
      sort_order: 2,
      created_by: "demo-admin",
      created_at: now,
      updated_at: now,
    },
  ];
}

async function readJsonCookie<T>(name: string, fallback: T): Promise<T> {
  const store = await cookies();
  const raw = store.get(name)?.value;
  if (!raw) return fallback;
  try {
    return JSON.parse(decodeURIComponent(raw)) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonCookie<T>(name: string, value: T) {
  const store = await cookies();
  store.set(name, encodeURIComponent(JSON.stringify(value)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function readDemoPaymentMethods() {
  return readJsonCookie(METHODS_COOKIE, seedMethods());
}

export async function writeDemoPaymentMethods(items: PaymentMethod[]) {
  await writeJsonCookie(METHODS_COOKIE, items);
}
