import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getProgressDenominator,
  getProgressPercent,
  getBulkJumpThreshold,
  partsToDuration,
} from "../../book-progress.ts";

test("print book progress uses catalog total pages", () => {
  const book = {
    consumptionFormat: "print" as const,
    totalPages: 400,
    currentPage: 100,
    editionTotalPages: null,
    totalDurationSeconds: null,
    currentPositionSeconds: 0,
  };
  assert.equal(getProgressDenominator(book), 400);
  assert.equal(getProgressPercent(book), 25);
});

test("ebook progress uses edition page count", () => {
  const book = {
    consumptionFormat: "ebook" as const,
    totalPages: 400,
    currentPage: 200,
    editionTotalPages: 800,
    totalDurationSeconds: null,
    currentPositionSeconds: 0,
  };
  assert.equal(getProgressPercent(book), 25);
});

test("audiobook progress uses duration", () => {
  const book = {
    consumptionFormat: "audiobook" as const,
    totalPages: 400,
    currentPage: 0,
    editionTotalPages: null,
    totalDurationSeconds: 36000,
    currentPositionSeconds: 9000,
  };
  assert.equal(getProgressPercent(book), 25);
});

test("audiobook bulk jump threshold is percentage based", () => {
  const book = {
    consumptionFormat: "audiobook" as const,
    totalPages: 400,
    currentPage: 0,
    editionTotalPages: null,
    totalDurationSeconds: 36000,
    currentPositionSeconds: 0,
  };
  assert.equal(getBulkJumpThreshold(book, 50), 9000);
});

test("partsToDuration combines h/m/s", () => {
  assert.equal(partsToDuration(2, 30, 15), 9015);
});
