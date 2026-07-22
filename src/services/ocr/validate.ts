import type { OcrExtractionResult } from "@/services/ocr/types";

export type BillExpectation = {
  amount: number;
  dueDate: string;
  merchant?: string | null;
  currency?: string;
};

export type OcrValidationResult = {
  amountMatch: boolean;
  dateMatch: boolean;
  merchantMatch: boolean;
  overallMatch: boolean;
  confidence: number;
  mismatches: Array<{
    field: "amount" | "date" | "merchant";
    expected: string;
    actual: string;
  }>;
};

function normalizeMerchant(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function amountsClose(expected: number, actual: number | null, tolerance = 0.5) {
  if (actual === null || Number.isNaN(actual)) return false;
  return Math.abs(expected - actual) <= tolerance;
}

function datesClose(expected: string, actual: string | null, dayWindow = 7) {
  if (!actual) return false;
  const expectedDate = new Date(`${expected.slice(0, 10)}T12:00:00`);
  const normalized = actual.includes("-")
    ? actual
    : actual.replace(/\//g, "-");
  const actualDate = new Date(normalized);
  if (Number.isNaN(actualDate.getTime()) || Number.isNaN(expectedDate.getTime())) {
    return false;
  }
  const diffDays =
    Math.abs(expectedDate.getTime() - actualDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= dayWindow;
}

function merchantsClose(expected: string | null | undefined, actual: string | null) {
  if (!expected || !actual) return false;
  const a = normalizeMerchant(expected);
  const b = normalizeMerchant(actual);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a) || a.split(" ")[0] === b.split(" ")[0];
}

export function validateOcrAgainstBill(
  extraction: OcrExtractionResult,
  expected: BillExpectation
): OcrValidationResult {
  const amountMatch = amountsClose(expected.amount, extraction.amount);
  const dateMatch = datesClose(expected.dueDate, extraction.date);
  const merchantMatch = merchantsClose(expected.merchant, extraction.merchant);

  const mismatches: OcrValidationResult["mismatches"] = [];

  if (!amountMatch) {
    mismatches.push({
      field: "amount",
      expected: expected.amount.toFixed(2),
      actual: extraction.amount?.toFixed(2) ?? "—",
    });
  }
  if (!dateMatch) {
    mismatches.push({
      field: "date",
      expected: expected.dueDate,
      actual: extraction.date ?? "—",
    });
  }
  if (!merchantMatch) {
    mismatches.push({
      field: "merchant",
      expected: expected.merchant ?? "—",
      actual: extraction.merchant ?? "—",
    });
  }

  // Amount is required for an overall match; merchant/date strengthen confidence.
  const overallMatch = amountMatch && (merchantMatch || dateMatch);

  return {
    amountMatch,
    dateMatch,
    merchantMatch,
    overallMatch,
    confidence: extraction.confidence,
    mismatches,
  };
}
