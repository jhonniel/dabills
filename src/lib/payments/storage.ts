import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type StoredReceipt = {
  storagePath: string;
  publicUrl?: string | null;
  bytes: Buffer;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

const QR_MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

function qrExtension(mimeType: string, fileName: string) {
  const fromMime = QR_MIME_EXT[mimeType.toLowerCase()];
  if (fromMime) return fromMime;
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "png";
}

async function storePaymentQrLocally(input: {
  methodId: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}) {
  const ext = qrExtension(input.mimeType, input.fileName);
  const dir = path.join(process.cwd(), "public", "uploads", "payment-qr");
  await mkdir(dir, { recursive: true });
  const safeId = input.methodId.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${safeId}.${ext}`;
  await writeFile(path.join(dir, storedName), input.bytes);
  return `/uploads/payment-qr/${storedName}?v=${Date.now()}`;
}

/**
 * Store a payment-method QR image and return a publicly displayable URL.
 * Demo / fallback: writes under public/uploads/payment-qr.
 * Supabase: uploads to the public `payment-qr` bucket.
 */
export async function storePaymentQr(input: {
  methodId: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<string> {
  if (!isSupabaseConfigured()) {
    return storePaymentQrLocally(input);
  }

  try {
    const admin = createAdminClient();
    const ext = qrExtension(input.mimeType, input.fileName);
    const safeId = input.methodId.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${safeId}.${ext}`;

    const { error } = await admin.storage
      .from("payment-qr")
      .upload(storagePath, input.bytes, {
        contentType: input.mimeType,
        upsert: true,
      });

    if (error) {
      console.error("storePaymentQr", error.message);
      return storePaymentQrLocally(input);
    }

    const { data } = admin.storage.from("payment-qr").getPublicUrl(storagePath);
    return `${data.publicUrl}?v=${Date.now()}`;
  } catch (error) {
    console.error("storePaymentQr", error);
    return storePaymentQrLocally(input);
  }
}

/**
 * Store a receipt image.
 * - Supabase Storage when configured
 * - Demo path metadata otherwise (bytes kept only for OCR in-request)
 */
export async function storeReceipt(input: {
  userId: string;
  paymentId: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<StoredReceipt> {
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${input.userId}/${input.paymentId}/${Date.now()}-${safeName}`;

  if (!isSupabaseConfigured()) {
    return {
      storagePath: `demo://${storagePath}`,
      publicUrl: null,
      bytes: input.bytes,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.bytes.byteLength,
    };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.storage
      .from("receipts")
      .upload(storagePath, input.bytes, {
        contentType: input.mimeType,
        upsert: false,
      });

    if (error) {
      console.error("storeReceipt", error.message);
      return {
        storagePath: `demo://${storagePath}`,
        publicUrl: null,
        bytes: input.bytes,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.bytes.byteLength,
      };
    }

    return {
      storagePath,
      publicUrl: null,
      bytes: input.bytes,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.bytes.byteLength,
    };
  } catch (error) {
    console.error("storeReceipt", error);
    return {
      storagePath: `demo://${storagePath}`,
      publicUrl: null,
      bytes: input.bytes,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.bytes.byteLength,
    };
  }
}

export async function createSignedReceiptUrl(storagePath: string) {
  if (!isSupabaseConfigured() || storagePath.startsWith("demo://")) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(storagePath, 60 * 60);

  if (error) return null;
  return data.signedUrl;
}
