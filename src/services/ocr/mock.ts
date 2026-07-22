import type { OcrExtractionResult, OcrProvider } from "./types";

/**
 * Demo/fallback OCR provider used when no API key is configured.
 * Prefers expected bill hints so local flows are testable end-to-end.
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
    const merchant = hints?.expectedMerchant ?? "Demo Merchant";

    return {
      merchant: mismatch ? `${merchant} Inc.` : merchant,
      amount: mismatch ? Number((amount + 1.5).toFixed(2)) : amount,
      referenceNumber: `REF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      date: hints?.expectedDate ?? new Date().toISOString().slice(0, 10),
      confidence: mismatch ? 0.64 : 0.88,
      raw: {
        provider: "mock",
        note: "Mock OCR — configure OCR_SPACE_API_KEY or GOOGLE_VISION_API_KEY for live extraction",
      },
    };
  }
}
