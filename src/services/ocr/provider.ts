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

function hasLiveOcrCredentials(name: OcrProviderName) {
  if (name === "ocrspace") return Boolean(process.env.OCR_SPACE_API_KEY);
  if (name === "google-vision") return Boolean(process.env.GOOGLE_VISION_API_KEY);
  return false;
}

/**
 * Swappable OCR provider factory.
 * Set OCR_PROVIDER=ocrspace | google-vision
 * Falls back to mock provider when credentials are missing.
 */
export function getOcrProvider(
  name: OcrProviderName = (process.env.OCR_PROVIDER as OcrProviderName) ||
    "ocrspace"
): OcrProvider {
  if (!hasLiveOcrCredentials(name)) {
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
  const providerName =
    (process.env.OCR_PROVIDER as OcrProviderName) || "ocrspace";
  const provider = getOcrProvider(providerName);

  if (provider instanceof MockOcrProvider) {
    const result = await provider.extract(image, mimeType, hints);
    return { ...result, provider: provider.name };
  }

  const result = await provider.extract(image, mimeType);
  return { ...result, provider: provider.name };
}

export type { OcrExtractionResult, OcrProvider, OcrProviderName } from "./types";
