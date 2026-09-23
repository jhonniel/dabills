import type { OcrExtractionResult, OcrProvider } from "./types";

function mimeToFiletype(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes("png")) return "PNG";
  if (normalized.includes("webp")) return "PNG";
  if (normalized.includes("gif")) return "GIF";
  if (normalized.includes("bmp")) return "BMP";
  if (normalized.includes("tif")) return "TIF";
  if (normalized.includes("pdf")) return "PDF";
  return "JPG";
}

function parseAmount(text: string): number | null {
  const patterns = [
    /(?:amount|total|paid|sent|transfer(?:red)?)\s*[:\-]?\s*(?:PHP|USD|₱|P)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2})?)/i,
    /(?:PHP|USD|₱)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2})?)/i,
    /([0-9]{1,3}(?:,[0-9]{3})+\.[0-9]{2})/,
    /([0-9]+\.[0-9]{2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const value = Number(match[1].replace(/,/g, ""));
    if (!Number.isNaN(value) && value > 0) return value;
  }
  return null;
}

function parseReference(text: string): string | null {
  const patterns = [
    /(?:ref(?:erence)?(?:\s*(?:no\.?|number|#))?|txn(?:\s*id)?|transaction(?:\s*(?:id|no\.?|number))?|control\s*(?:no\.?|number)?|tracking\s*(?:no\.?|number)?|confirmation(?:\s*(?:no\.?|number|#))?)\s*[:\-#]?\s*([A-Z0-9-]{6,})/i,
    /\b(?:ref|reference)\s+([A-Z0-9-]{6,})\b/i,
    /\b([0-9]{10,})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

type OcrSpaceResponse = {
  OCRExitCode?: number;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ErrorDetails?: string;
  ParsedResults?: Array<{
    ParsedText?: string;
    FileParseExitCode?: number;
    ErrorMessage?: string;
  }>;
};

/** OCR.space — extracts only amount + transfer reference for payment proof. */
export class OcrSpaceProvider implements OcrProvider {
  readonly name = "ocrspace";

  async extract(
    image: Buffer | ArrayBuffer,
    mimeType: string
  ): Promise<OcrExtractionResult> {
    const apiKey = process.env.OCR_SPACE_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("OCR_SPACE_API_KEY is not configured");
    }

    const buffer = Buffer.isBuffer(image) ? image : Buffer.from(image);
    const filetype = mimeToFiletype(mimeType);
    const base64 = buffer.toString("base64");
    const form = new FormData();
    form.append("base64Image", `data:${mimeType};base64,${base64}`);
    form.append("filetype", filetype);
    form.append("language", "eng");
    form.append("isOverlayRequired", "false");
    form.append("detectOrientation", "true");
    form.append("scale", "true");
    form.append("OCREngine", "2");

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { apikey: apiKey },
      body: form,
    });

    if (!response.ok) {
      throw new Error(`OCR.space request failed: ${response.status}`);
    }

    const raw = (await response.json()) as OcrSpaceResponse;
    if (raw.IsErroredOnProcessing || (raw.OCRExitCode ?? 1) > 2) {
      const message = Array.isArray(raw.ErrorMessage)
        ? raw.ErrorMessage.join("; ")
        : raw.ErrorMessage || raw.ErrorDetails || "OCR.space processing failed";
      throw new Error(message);
    }

    const parsed = raw.ParsedResults?.[0];
    const text = parsed?.ParsedText ?? "";
    if (!text.trim()) {
      const parseError = parsed?.ErrorMessage || "No text found on receipt";
      throw new Error(parseError);
    }

    return {
      merchant: null,
      amount: parseAmount(text),
      referenceNumber: parseReference(text),
      date: null,
      confidence: text.length > 40 ? 0.82 : 0.65,
      raw: raw as unknown as Record<string, unknown>,
    };
  }
}
