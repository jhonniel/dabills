import type { OcrExtractionResult } from "@/services/ocr/types";

export type BillExpectation = {
  amount: number;
  currency?: string;
  /** Manual reference typed by the user (fallback if OCR misses it). */
  providedReference?: string | null;
};

export type OcrValidationResult = {
  amountMatch: boolean;
  /** True when OCR (or the user) supplied a transfer reference. */
  referenceMatch: boolean;
  overallMatch: boolean;
  confidence: number;
  mismatches: Array<{
    field: "amount" | "reference";
    expected: string;
    actual: string;
  }>;
};

function amountsClose(expected: number, actual: number | null, tolerance = 0.5) {
  if (actual === null || Number.isNaN(actual)) return false;
  return Math.abs(expected - actual) <= tolerance;
}

function hasReference(
  extracted: string | null | undefined,
  provided: string | null | undefined
) {
  const fromOcr = extracted?.trim() ?? "";
  const fromUser = provided?.trim() ?? "";
  return fromOcr.length >= 6 || fromUser.length >= 6;
}

/**
 * Auto-confirm when the receipt proves the transfer:
 * - OCR amount matches the bill amount
 * - A transfer reference is present (from OCR or typed by the user)
 */
export function validateOcrAgainstBill(
  extraction: OcrExtractionResult,
  expected: BillExpectation
): OcrValidationResult {
  const amountMatch = amountsClose(expected.amount, extraction.amount);
  const referenceMatch = hasReference(
    extraction.referenceNumber,
    expected.providedReference
  );

  const mismatches: OcrValidationResult["mismatches"] = [];

  if (!amountMatch) {
    mismatches.push({
      field: "amount",
      expected: expected.amount.toFixed(2),
      actual: extraction.amount?.toFixed(2) ?? "—",
    });
  }
  if (!referenceMatch) {
    mismatches.push({
      field: "reference",
      expected: "Transfer reference on receipt",
      actual:
        extraction.referenceNumber?.trim() ||
        expected.providedReference?.trim() ||
        "—",
    });
  }

  return {
    amountMatch,
    referenceMatch,
    overallMatch: amountMatch && referenceMatch,
    confidence: extraction.confidence,
    mismatches,
  };
}
