import type { OcrExtractionResult, OcrProvider } from "./types";

/**
 * Google Cloud Vision OCR provider (DOCUMENT_TEXT_DETECTION).
 * Enable with OCR_PROVIDER=google-vision and GOOGLE_VISION_API_KEY.
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
      merchant:
        text
          .split("\n")
          .map((line) => line.trim())
          .find((line) => line.length > 2) ?? null,
      amount: parseAmount(text),
      referenceNumber: parseReference(text),
      date: parseDate(text),
      confidence: text ? 0.8 : 0,
      raw: raw as unknown as Record<string, unknown>,
    };
  }
}

function parseAmount(text: string): number | null {
  const match = text.match(
    /(?:PHP|USD|\$|₱)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/i
  );
  if (!match?.[1]) return null;
  return Number(match[1].replace(/,/g, ""));
}

function parseReference(text: string): string | null {
  const match = text.match(
    /(?:ref(?:erence)?(?:\s*(?:no|number|#))?[:\s-]*)([A-Z0-9-]{6,})/i
  );
  return match?.[1] ?? null;
}

function parseDate(text: string): string | null {
  const match = text.match(
    /(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/
  );
  return match?.[1] ?? null;
}
