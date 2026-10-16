import assert from "node:assert/strict";
import test from "node:test";
import { getDefaultPickupDate, getTodayIstDate } from "../src/features/booking/clean/dateTime.ts";

test("IST today stays correct late in the UTC day", () => {
  const now = new Date("2026-10-17T18:00:00.000Z"); // 23:30 in India
  assert.equal(getTodayIstDate(now), "2026-10-17");
  assert.equal(getDefaultPickupDate(now), "2026-10-18");
});

test("IST today advances when UTC has crossed into a new IST date", () => {
  const now = new Date("2026-10-17T20:00:00.000Z"); // 01:30 in India on Oct 18
  assert.equal(getTodayIstDate(now), "2026-10-18");
  assert.equal(getDefaultPickupDate(now), "2026-10-19");
});
