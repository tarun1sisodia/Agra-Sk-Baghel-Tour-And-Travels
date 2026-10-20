import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isFailClosedCatalogBuild,
  assertSnapshotPolicy,
  assertFailClosedCatalogEnv,
  listCatalogSources,
  resolveCatalogApiBase,
  FORBIDDEN_STAGING_HOST,
} from "./catalog-sources.ts";
import { isSitemapSafeSlug, getSitemapEntries } from "./generate-sitemap.ts";

describe("Phase D.2 — Dynamic Catalog Publishing, SEO & SSG Pipeline (Build & Integration Contract)", () => {
  const CANONICAL_ORIGIN = "https://agraskbagheltourandtravels.com";

  it("1. Production slug validation: isSitemapSafeSlug validates canonical slug criteria", () => {
    // Valid slugs
    assert.equal(isSitemapSafeSlug("agra-sunrise-vip"), true);
    assert.equal(isSitemapSafeSlug("delhi-airport-to-agra"), true);
    assert.equal(isSitemapSafeSlug("agra-heritage-walk"), true);

    // Invalid / unsafe slugs rejected
    assert.equal(isSitemapSafeSlug(""), false);
    assert.equal(isSitemapSafeSlug("-leading-dash"), false);
    assert.equal(isSitemapSafeSlug("trailing-dash-"), false);
    assert.equal(isSitemapSafeSlug("double--hyphen"), false);
    assert.equal(isSitemapSafeSlug("command-run"), false);
    assert.equal(isSitemapSafeSlug("123-btn-submit"), false);
  });

  it("2. Fail-closed release build invariants: missing source or stale snapshot strictly fails", () => {
    // Fail-closed detection
    assert.equal(isFailClosedCatalogBuild({ RELEASE_BUILD: "1" }), true);
    assert.equal(isFailClosedCatalogBuild({ CF_PAGES: "1" }), true);
    assert.equal(isFailClosedCatalogBuild({ CATALOG_FAIL_CLOSED: "1" }), true);
    assert.equal(isFailClosedCatalogBuild({}), false);

    // Missing API source in fail-closed build throws immediately
    assert.throws(
      () => assertFailClosedCatalogEnv({ RELEASE_BUILD: "1" }),
      /Fail-closed catalog build is missing required source URLs/,
    );

    // Staging forbidden on main branch
    assert.throws(
      () =>
        assertFailClosedCatalogEnv({
          RELEASE_BUILD: "1",
          CF_PAGES_BRANCH: "main",
          VITE_API_BASE_URL: `https://${FORBIDDEN_STAGING_HOST}`,
        }),
      /Production catalog source points at/,
    );

    // Valid API base resolves all required source endpoints
    const sources = listCatalogSources({
      VITE_API_BASE_URL: "https://api.agraskbagheltourandtravels.com",
    });
    assert.equal(sources.length, 6);
    for (const source of sources) {
      assert.ok(source.url?.startsWith("https://api.agraskbagheltourandtravels.com/api/v1/"));
    }

    // Fail-closed snapshot policy strictly rejects preserving un-fetched / stale snapshots
    assert.throws(
      () => assertSnapshotPolicy(false, true, "src/data/generated-published-tour-packages.json"),
      /Fail-closed build failed to fetch snapshot/,
    );

    // Non-fail-closed development build allows preserving existing snapshot
    assert.doesNotThrow(() =>
      assertSnapshotPolicy(false, false, "src/data/generated-published-tour-packages.json"),
    );
  });

  it("3. Real production sitemap invariants: all generated entries are valid canonical paths with no forbidden domains", () => {
    const entries = getSitemapEntries();
    assert.ok(entries.length > 0, "Sitemap should contain production entries");

    for (const entry of entries) {
      // Must be absolute canonical domain or valid relative path
      assert.ok(
        entry.path.startsWith("/") || entry.path.startsWith(CANONICAL_ORIGIN),
        `Path ${entry.path} must start with / or canonical origin`,
      );
      // Never point to workers.dev fallback
      assert.ok(
        !entry.path.includes("workers.dev"),
        `Path ${entry.path} must not contain workers.dev`,
      );
      // Valid sitemap priority
      assert.ok(entry.priority >= 0.1 && entry.priority <= 1.0, "Priority must be between 0.1 and 1.0");
    }

    // Must have no duplicates in English canonical paths
    const pathSet = new Set<string>();
    for (const entry of entries) {
      assert.ok(!pathSet.has(entry.path), `Duplicate sitemap path detected: ${entry.path}`);
      pathSet.add(entry.path);
    }
  });

  it("4. Canonical detail route format contract for packages, local tours, and transfers", () => {
    function resolveCanonicalDetailUrl(type: "tour_package" | "local_package" | "transfer", slug: string): string {
      assert.ok(isSitemapSafeSlug(slug), `Slug must be valid: ${slug}`);
      const prefix =
        type === "local_package"
          ? "local-packages"
          : type === "transfer"
            ? "transfers"
            : "packages";
      return `${CANONICAL_ORIGIN}/en/${prefix}/${slug}/`;
    }

    assert.equal(
      resolveCanonicalDetailUrl("tour_package", "taj-sunrise-deluxe"),
      "https://agraskbagheltourandtravels.com/en/packages/taj-sunrise-deluxe/",
    );
    assert.equal(
      resolveCanonicalDetailUrl("local_package", "agra-heritage-circuit"),
      "https://agraskbagheltourandtravels.com/en/local-packages/agra-heritage-circuit/",
    );
    assert.equal(
      resolveCanonicalDetailUrl("transfer", "delhi-igi-to-agra"),
      "https://agraskbagheltourandtravels.com/en/transfers/delhi-igi-to-agra/",
    );
  });
});

