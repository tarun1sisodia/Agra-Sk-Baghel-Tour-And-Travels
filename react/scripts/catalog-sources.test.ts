import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FORBIDDEN_STAGING_HOST,
  assertFailClosedCatalogEnv,
  assertSnapshotPolicy,
  catalogSourceUsesStagingHost,
  isFailClosedCatalogBuild,
  listCatalogSources,
  resolveCatalogApiBase,
} from "./catalog-sources.ts";

describe("catalog source resolution (P0-T03 / P0-T04)", () => {
  it("does not default missing production variables to the staging API", () => {
    const env = {
      CATALOG_FAIL_CLOSED: "1",
      VITE_API_BASE_URL: undefined,
      CATALOG_API_URL: undefined,
    };
    assert.equal(resolveCatalogApiBase(env), undefined);
    for (const source of listCatalogSources(env)) {
      assert.equal(source.url, undefined);
      assert.equal(catalogSourceUsesStagingHost(source.url), false);
    }
    assert.throws(
      () => assertFailClosedCatalogEnv(env),
      (error: unknown) => error instanceof Error && error.message.includes(FORBIDDEN_STAGING_HOST),
    );
  });

  it("derives the implemented content manifest path from the API base", () => {
    const env = { VITE_API_BASE_URL: "https://api.agraskbagheltourandtravels.com/" };
    const sources = Object.fromEntries(listCatalogSources(env).map((source) => [source.name, source.url]));
    assert.equal(sources["content-manifest"], "https://api.agraskbagheltourandtravels.com/api/v1/content/manifest");
    assert.equal(sources["route-catalog"], "https://api.agraskbagheltourandtravels.com/api/v1/route-catalog/manifest");
    assert.equal(sources["tour-packages"], "https://api.agraskbagheltourandtravels.com/api/v1/tour-packages/manifest");
    assert.equal(sources["local-packages"], "https://api.agraskbagheltourandtravels.com/api/v1/local-packages/manifest");
    assert.equal(sources["transfer-routes"], "https://api.agraskbagheltourandtravels.com/api/v1/transfer-routes/manifest");
  });

  it("prefers the exact ROUTE_CATALOG_MANIFEST_URL spelling over a constructed fallback", () => {
    const env = {
      VITE_API_BASE_URL: "https://api.example.test",
      ROUTE_CATALOG_MANIFEST_URL: "https://api.example.test/custom/routes.json",
    };
    const routeSource = listCatalogSources(env).find((source) => source.name === "route-catalog");
    assert.equal(routeSource?.url, "https://api.example.test/custom/routes.json");
  });

  it("enforces fail-closed snapshot policy to prevent silent preservation of stale catalogue files", () => {
    // In local development / offline build, un-fetched snapshots are allowed to be preserved
    assert.doesNotThrow(() => assertSnapshotPolicy(false, false, "path/to/snapshot.json"));
    assert.doesNotThrow(() => assertSnapshotPolicy(true, true, "path/to/snapshot.json"));

    // In production fail-closed build, an un-fetched snapshot must throw and fail the build
    assert.throws(
      () => assertSnapshotPolicy(false, true, "path/to/snapshot.json"),
      /Fail-closed build failed to fetch snapshot/,
    );
  });

  it("treats RELEASE_BUILD=1, CATALOG_FAIL_CLOSED=1, and CF_PAGES=1 as fail-closed", () => {
    assert.equal(isFailClosedCatalogBuild({}), false);
    assert.equal(isFailClosedCatalogBuild({ RELEASE_BUILD: "1" }), true);
    assert.equal(isFailClosedCatalogBuild({ CATALOG_FAIL_CLOSED: "1" }), true);
    assert.equal(isFailClosedCatalogBuild({ CF_PAGES: "1" }), true);
  });
});

