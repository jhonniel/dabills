import type { OcrExtractionResult, OcrProvider } from "./types";

function parseAmount(text: string): number | null {
  const match = text.match(/(?:PHP|USD|\$|₱)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/i);
  if (!match?.[1]) return null;
  return Number(match[1].replace(/,/g, ""));
}

function parseReference(text: string): string | null {
  const match = text.match(/(?:ref(?:erence)?(?:\s*(?:no|number|#))?[:\s-]*)([A-Z0-9-]{6,})/i);
  return match?.[1] ?? null;
}

function parseDate(text: string): string | null {
  const match = text.match(
    /(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/
  );
  return match?.[1] ?? null;
}

export class OcrSpaceProvider implements OcrProvider {
  readonly name = "ocrspace";

  async extract(
    image: Buffer | ArrayBuffer,
    mimeType: string
  ): Promise<OcrExtractionResult> {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) {
      throw new Error("OCR_SPACE_API_KEY is not configured");
    }

    const buffer = Buffer.isBuffer(image) ? image : Buffer.from(image);
    const base64 = buffer.toString("base64");
    const form = new FormData();
    form.append("base64Image", `data:${mimeType};base64,${base64}`);
    form.append("language", "eng");
    form.append("isOverlayRequired", "false");
    form.append("OCREngine", "2");

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { apikey: apiKey },
      body: form,
    });

    if (!response.ok) {
      throw new Error(`OCR.space request failed: ${response.status}`);
    }

    const raw = (await response.json()) as Record<string, unknown>;
    const parsedResults = raw.ParsedResults as
      | Array<{ ParsedText?: string }>
      | undefined;
    const text = parsedResults?.[0]?.ParsedText ?? "";

    return {
      merchant: text.split("\n").find((line) => line.trim().length > 2)?.trim() ?? null,
      amount: parseAmount(text),
      referenceNumber: parseReference(text),
      date: parseDate(text),
      confidence: text ? 0.75 : 0,
      raw,
    };
  }
}
