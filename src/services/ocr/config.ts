import type { OcrProviderName } from "./types";

const PLACEHOLDER_KEYS = new Set([
  "",
  "your-ocr-space-key",
  "your-google-vision-key",
  "changeme",
  "change-me",
]);

export function isConfiguredSecret(value: string | undefined) {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (PLACEHOLDER_KEYS.has(trimmed.toLowerCase())) return false;
  if (trimmed.includes("xxxxxxxx")) return false;
  return true;
}

export function resolveOcrProviderName(): OcrProviderName | "mock" {
  const raw = (process.env.OCR_PROVIDER ?? "ocrspace").trim().toLowerCase();
  if (raw === "mock") return "mock";
  if (raw === "google-vision" || raw === "google_vision") return "google-vision";
  return "ocrspace";
}

export function hasLiveOcrCredentials(name: OcrProviderName | "mock") {
  if (name === "mock") return false;
  if (name === "ocrspace") {
    return isConfiguredSecret(process.env.OCR_SPACE_API_KEY);
  }
  if (name === "google-vision") {
    return isConfiguredSecret(process.env.GOOGLE_VISION_API_KEY);
  }
  return false;
}

/** True when a live OCR provider will run (not mock fallback). */
export function isLiveOcrEnabled() {
  const name = resolveOcrProviderName();
  return hasLiveOcrCredentials(name);
}

export function activeOcrProviderLabel() {
  const name = resolveOcrProviderName();
  if (!hasLiveOcrCredentials(name)) return "mock";
  return name;
}
