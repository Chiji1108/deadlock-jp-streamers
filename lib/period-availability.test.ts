import { expect, test } from "vitest";
import {
  availablePeriods,
  resolvePeriod,
  MEASUREMENT_STARTED_AT,
} from "./period-availability";
const DAY = 86_400_000;
test.each([
  [0, ["all"]],
  [7 * DAY - 1, ["all"]],
  [7 * DAY, ["week", "all"]],
  [30 * DAY - 1, ["week", "all"]],
  [30 * DAY, ["week", "month", "all"]],
  [90 * DAY - 1, ["week", "month", "all"]],
  [90 * DAY, ["week", "month", "quarter", "all"]],
])("period choices after %s milliseconds", (elapsed, expected) => {
  expect(availablePeriods(MEASUREMENT_STARTED_AT + elapsed)).toEqual(expected);
});
test("unavailable URL periods resolve to all; existing valid selections remain", () => {
  for (const raw of [null, "week", "month", "quarter", "all", "invalid"])
    expect(resolvePeriod(raw, MEASUREMENT_STARTED_AT)).toBe("all");
  expect(availablePeriods(undefined)).toEqual(["all"]);
  expect(availablePeriods(MEASUREMENT_STARTED_AT - DAY)).toEqual(["all"]);
  expect(resolvePeriod("month", MEASUREMENT_STARTED_AT + 30 * DAY)).toBe(
    "month",
  );
  expect(resolvePeriod(null, MEASUREMENT_STARTED_AT + 30 * DAY)).toBe("week");
});
