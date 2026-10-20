import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { APPROVED_PRODUCTION_ORIGIN, isHindiIndexingEnabled, resolveSiteOrigin } from "../src/config/siteOrigin.ts";

describe("canonical site origin", () => {
  it("uses the approved production origin when no local override is supplied", () => {
    assert.equal(resolveSiteOrigin(undefined, "development"), APPROVED_PRODUCTION_ORIGIN);
  });
  it("normalizes a trailing slash", () => {
    assert.equal(resolveSiteOrigin("https://agraskbagheltourandtravels.com/", "production"), "https://agraskbagheltourandtravels.com");
    assert.equal(resolveSiteOrigin("https://skbagheltravels-customer.coccoder999.workers.dev/", "production"), "https://skbagheltravels-customer.coccoder999.workers.dev");
  });
  it("rejects non-approved hosts in release mode", () => {
    assert.throws(() => resolveSiteOrigin("https://preview.workers.dev", "production"), /must equal/);
  });
  it("requires HTTPS for non-local origins", () => {
    assert.throws(() => resolveSiteOrigin("http://preview.example.test", "preview"), /must use HTTPS/);
  });
  it("allows HTTPS preview origins", () => {
    assert.equal(resolveSiteOrigin("https://preview.example.test", "preview"), "https://preview.example.test");
  });
  it("permits HTTP only on loopback in development", () => {
    assert.equal(resolveSiteOrigin("http://localhost:5173/", "development"), "http://localhost:5173");
    assert.throws(() => resolveSiteOrigin("http://example.test", "development"), /must use HTTPS/);
  });
  it("rejects paths and credentials", () => {
    assert.throws(() => resolveSiteOrigin("https://example.test/path", "preview"), /must not contain a path/);
    assert.throws(() => resolveSiteOrigin("https://user:pass@example.test", "preview"), /without credentials/);
  });
  it("keeps Hindi indexing disabled unless explicitly enabled", () => {
    assert.equal(isHindiIndexingEnabled(undefined), false);
    assert.equal(isHindiIndexingEnabled("false"), false);
    assert.equal(isHindiIndexingEnabled("true"), true);
  });
});