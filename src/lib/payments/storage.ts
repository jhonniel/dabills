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
