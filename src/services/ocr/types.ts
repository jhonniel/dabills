export interface OcrExtractionResult {
  merchant: string | null;
  amount: number | null;
  referenceNumber: string | null;
  date: string | null;
  confidence: number;
  raw: Record<string, unknown>;
}

export interface OcrProvider {
  readonly name: string;
  extract(image: Buffer | ArrayBuffer, mimeType: string): Promise<OcrExtractionResult>;
}

export type OcrProviderName = "ocrspace" | "google-vision";
