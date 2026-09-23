import type { OcrExtractionResult, OcrProvider } from "./types";

/**
 * Demo/fallback OCR — returns amount + reference only.
 */
export class MockOcrProvider implements OcrProvider {
  readonly name = "mock";

  async extract(
    _image: Buffer | ArrayBuffer,
    _mimeType: string,
    hints?: {
      expectedAmount?: number;
      expectedMerchant?: string;
      expectedDate?: string;
      forceMismatch?: boolean;
    }
  ): Promise<OcrExtractionResult> {
    const mismatch = hints?.forceMismatch === true;
    const amount = hints?.expectedAmount ?? 19.99;

    return {
      merchant: null,
      amount: mismatch ? Number((amount + 1.5).toFixed(2)) : amount,
      referenceNumber: mismatch
        ? null
        : `REF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      date: null,
      confidence: mismatch ? 0.64 : 0.88,
      raw: {
        provider: "mock",
        note: "Mock OCR — configure OCR_SPACE_API_KEY for live extraction",
      },
    };
  }
}
