import { ApiError } from "@/lib/api-utils";
import {
  getProgressDenominator,
  type BookProgressFields,
} from "@/lib/book-progress";

export function assertProgressMetadata(book: BookProgressFields) {
  if (book.consumptionFormat === "ebook" && !book.editionTotalPages) {
    throw new ApiError(400, "Set your edition page count before logging progress.");
  }
  if (book.consumptionFormat === "audiobook" && !book.totalDurationSeconds) {
    throw new ApiError(400, "Set the audiobook runtime before logging progress.");
  }
}

export function validateProgressValue(book: BookProgressFields, value: number) {
  assertProgressMetadata(book);
  const denom = getProgressDenominator(book);
  const label =
    book.consumptionFormat === "audiobook"
      ? "currentPositionSeconds"
      : "currentPage";
  if (value < 0 || value > denom) {
    throw new ApiError(400, `${label} must be between 0 and ${denom}`);
  }
}
