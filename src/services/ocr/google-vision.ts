import type { OcrExtractionResult, OcrProvider } from "./types";

/**
 * Google Cloud Vision OCR provider (DOCUMENT_TEXT_DETECTION).
 * Extracts only amount + transfer reference for payment proof.
 */
export class GoogleVisionProvider implements OcrProvider {
  readonly name = "google-vision";

  async extract(
    image: Buffer | ArrayBuffer,
    mimeType: string
  ): Promise<OcrExtractionResult> {
    void mimeType;
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_VISION_API_KEY is not configured");
    }

    const buffer = Buffer.isBuffer(image) ? image : Buffer.from(image);
    const content = buffer.toString("base64");

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Vision request failed: ${response.status}`);
    }

    const raw = (await response.json()) as {
      responses?: Array<{
        fullTextAnnotation?: { text?: string };
        textAnnotations?: Array<{ description?: string }>;
      }>;
    };

    const text =
      raw.responses?.[0]?.fullTextAnnotation?.text ??
      raw.responses?.[0]?.textAnnotations?.[0]?.description ??
      "";

    return {
      merchant: null,
      amount: parseAmount(text),
      referenceNumber: parseReference(text),
      date: null,
      confidence: text ? 0.8 : 0,
      raw: raw as unknown as Record<string, unknown>,
    };
  }
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
    /(?:ref(?:erence)?(?:\s*(?:no\.?|number|#))?|txn(?:\s*id)?|transaction(?:\s*(?:id|no\.?|number))?)\s*[:\-#]?\s*([A-Z0-9-]{6,})/i,
    /\b([0-9]{10,})\b/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}
