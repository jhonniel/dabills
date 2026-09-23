import {
  activeOcrProviderLabel,
  hasLiveOcrCredentials,
  resolveOcrProviderName,
} from "./config";
import { GoogleVisionProvider } from "./google-vision";
import { MockOcrProvider } from "./mock";
import { OcrSpaceProvider } from "./ocr-space";
import type { OcrExtractionResult, OcrProvider, OcrProviderName } from "./types";

export type OcrExtractHints = {
  expectedAmount?: number;
  expectedMerchant?: string;
  expectedDate?: string;
  forceMismatch?: boolean;
};

/**
 * Swappable OCR provider factory.
 * Set OCR_PROVIDER=ocrspace | google-vision | mock
 * Falls back to mock when credentials are missing/placeholder.
 */
export function getOcrProvider(
  name: OcrProviderName | "mock" = resolveOcrProviderName()
): OcrProvider {
  if (!hasLiveOcrCredentials(name) || name === "mock") {
    return new MockOcrProvider();
  }

  switch (name) {
    case "ocrspace":
      return new OcrSpaceProvider();
    case "google-vision":
      return new GoogleVisionProvider();
    default:
      throw new Error(`Unknown OCR provider: ${name as string}`);
  }
}

export async function runOcrExtraction(
  image: Buffer | ArrayBuffer,
  mimeType: string,
  hints?: OcrExtractHints
): Promise<OcrExtractionResult & { provider: string }> {
  const requested = resolveOcrProviderName();
  const provider = getOcrProvider(requested);

  if (provider instanceof MockOcrProvider) {
    const result = await provider.extract(image, mimeType, hints);
    return { ...result, provider: provider.name };
  }

  try {
    const result = await provider.extract(image, mimeType);
    return { ...result, provider: provider.name };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OCR extraction failed";
    throw new Error(`OCR.space failed: ${message}`);
  }
}

export { activeOcrProviderLabel, isLiveOcrEnabled } from "./config";
export type { OcrExtractionResult, OcrProvider, OcrProviderName } from "./types";
