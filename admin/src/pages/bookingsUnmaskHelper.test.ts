import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  initialUnmaskState,
  startUnmasking,
  applyUnmaskSuccess,
  applyUnmaskFailure,
  resetUnmaskState,
  resolveDisplayContact,
} from "./bookingsUnmaskHelper.ts";
import { can } from "../lib/types.ts";

describe("Admin Booking Unmask PII Frontend State & Security Suite", () => {
  it("1. Verifies role permission matrix for 'bookings:unmask'", () => {
    assert.equal(can("super_admin", "bookings:unmask"), true, "super_admin must be authorized to unmask PII");
  });

  it("2. Initial state is strictly masked and empty", () => {
    assert.equal(initialUnmaskState.unmasked, false);
    assert.equal(initialUnmaskState.unmaskedData, null);
    assert.equal(initialUnmaskState.unmasking, false);
    assert.equal(initialUnmaskState.error, null);

    const contact = resolveDisplayContact({
      unmasked: false,
      unmaskedData: null,
      rawPhone: "9876543221",
      rawEmail: "aman@example.com",
    });

    assert.notEqual(contact.phone, "9876543221", "Phone must not be visible when unmasked=false");
    assert.match(contact.phone, /98\*{4}3221/);
    assert.notEqual(contact.email, "aman@example.com", "Email must not be visible when unmasked=false");
    assert.match(contact.email, /a\*{4}@example\.com/);
  });

  it("3. startUnmasking sets loading flag and clears previous errors", () => {
    const errorState = applyUnmaskFailure("Network timed out");
    const loadingState = startUnmasking(errorState);

    assert.equal(loadingState.unmasking, true);
    assert.equal(loadingState.error, null);
    assert.equal(loadingState.unmasked, false);
    assert.equal(loadingState.unmaskedData, null);
  });

  it("4. Successful unmask response applies unmasked data and sets unmasked=true", () => {
    const successData = {
      customerPhone: "9876543221",
      customerEmail: "aman@example.com",
    };
    const state = applyUnmaskSuccess(successData);

    assert.equal(state.unmasked, true);
    assert.deepEqual(state.unmaskedData, successData);
    assert.equal(state.unmasking, false);
    assert.equal(state.error, null);

    const contact = resolveDisplayContact({
      unmasked: state.unmasked,
      unmaskedData: state.unmaskedData,
      rawPhone: "9876543221",
      rawEmail: "aman@example.com",
    });

    assert.equal(contact.phone, "9876543221", "Real unmasked phone must be displayed");
    assert.equal(contact.email, "aman@example.com", "Real unmasked email must be displayed");
  });

  it("5. Failure handling retains masked state, leaves unmaskedData null, and records error", () => {
    const state = applyUnmaskFailure("Failed to unmask customer PII: audit write failed.");

    assert.equal(state.unmasked, false);
    assert.equal(state.unmaskedData, null);
    assert.equal(state.unmasking, false);
    assert.equal(state.error, "Failed to unmask customer PII: audit write failed.");

    const contact = resolveDisplayContact({
      unmasked: state.unmasked,
      unmaskedData: state.unmaskedData,
      rawPhone: "9876543221",
      rawEmail: "aman@example.com",
    });

    assert.notEqual(contact.phone, "9876543221", "Phone must remain masked after failure");
    assert.match(contact.phone, /98\*{4}3221/);
    assert.notEqual(contact.email, "aman@example.com", "Email must remain masked after failure");
  });

  it("6. Reset behavior clears unmasked data and returns to masked state", () => {
    const activeState = applyUnmaskSuccess({
      customerPhone: "9876543221",
      customerEmail: "aman@example.com",
    });
    assert.equal(activeState.unmasked, true);

    // Resetting when toggled back to masked or when drawer closes / booking changes
    const resetState = resetUnmaskState();
    assert.equal(resetState.unmasked, false);
    assert.equal(resetState.unmaskedData, null);
    assert.equal(resetState.error, null);

    const contact = resolveDisplayContact({
      unmasked: resetState.unmasked,
      unmaskedData: resetState.unmaskedData,
      rawPhone: "9876543221",
      rawEmail: "aman@example.com",
    });

    assert.notEqual(contact.phone, "9876543221");
    assert.notEqual(contact.email, "aman@example.com");
  });
});
