import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

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

/**
 * Compress a receipt before uploading to Supabase Storage.
 * Max edge 1600px, JPEG ~75% — smaller files, still readable for audit.
 */
export async function compressReceiptImage(input: {
  bytes: Buffer;
  fileName: string;
}): Promise<{ bytes: Buffer; mimeType: string; fileName: string }> {
  try {
    const compressed = await sharp(input.bytes)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 75, mozjpeg: true })
      .toBuffer();

    const base = input.fileName.replace(/\.[^.]+$/, "") || "receipt";
    const safeBase = base.replace(/[^a-zA-Z0-9._-]/g, "_");

    return {
      bytes: compressed,
      mimeType: "image/jpeg",
      fileName: `${safeBase}.jpg`,
    };
  } catch (error) {
    console.error("compressReceiptImage", error);
    return {
      bytes: input.bytes,
      mimeType: "image/jpeg",
      fileName: input.fileName.replace(/\.[^.]+$/, "") + ".jpg",
    };
  }
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
 * Compress then store a receipt image in Supabase Storage (`receipts` bucket).
 * Demo path metadata otherwise (bytes kept only for OCR in-request).
 */
export async function storeReceipt(input: {
  userId: string;
  paymentId: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<StoredReceipt> {
  const compressed = await compressReceiptImage({
    bytes: input.bytes,
    fileName: input.fileName,
  });

  const safeName = compressed.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${input.userId}/${input.paymentId}/${Date.now()}-${safeName}`;

  if (!isSupabaseConfigured()) {
    return {
      storagePath: `demo://${storagePath}`,
      publicUrl: null,
      bytes: compressed.bytes,
      fileName: compressed.fileName,
      mimeType: compressed.mimeType,
      fileSize: compressed.bytes.byteLength,
    };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.storage
      .from("receipts")
      .upload(storagePath, compressed.bytes, {
        contentType: compressed.mimeType,
        upsert: false,
      });

    if (error) {
      console.error("storeReceipt", error.message);
      return {
        storagePath: `demo://${storagePath}`,
        publicUrl: null,
        bytes: compressed.bytes,
        fileName: compressed.fileName,
        mimeType: compressed.mimeType,
        fileSize: compressed.bytes.byteLength,
      };
    }

    return {
      storagePath,
      publicUrl: null,
      bytes: compressed.bytes,
      fileName: compressed.fileName,
      mimeType: compressed.mimeType,
      fileSize: compressed.bytes.byteLength,
    };
  } catch (error) {
    console.error("storeReceipt", error);
    return {
      storagePath: `demo://${storagePath}`,
      publicUrl: null,
      bytes: compressed.bytes,
      fileName: compressed.fileName,
      mimeType: compressed.mimeType,
      fileSize: compressed.bytes.byteLength,
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
