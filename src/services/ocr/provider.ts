import { OcrSpaceProvider } from "./ocr-space";
import type { OcrProvider, OcrProviderName } from "./types";

/**
 * Swappable OCR provider factory.
 * Set OCR_PROVIDER=ocrspace | google-vision
 */
export function getOcrProvider(
  name: OcrProviderName = (process.env.OCR_PROVIDER as OcrProviderName) ||
    "ocrspace"
): OcrProvider {
  switch (name) {
    case "ocrspace":
      return new OcrSpaceProvider();
    case "google-vision":
      // Phase 4: implement GoogleVisionProvider and swap here.
      throw new Error(
        "Google Vision provider is not implemented yet. Use OCR_PROVIDER=ocrspace."
      );
    default:
      throw new Error(`Unknown OCR provider: ${name as string}`);
  }
}

export type { OcrExtractionResult, OcrProvider } from "./types";
