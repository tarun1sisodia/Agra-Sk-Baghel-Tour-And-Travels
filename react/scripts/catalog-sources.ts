export const FORBIDDEN_STAGING_HOST = "skb-baghel-api-staging.onrender.com";

export type EnvMap = Record<string, string | undefined>;

export type CatalogSourceName =
  | "route-catalog"
  | "tour-packages"
  | "transfer-routes"
  | "local-packages"
  | "content-manifest"
  | "reviews";

export type CatalogSource = {
  name: CatalogSourceName;
  envVar: string;
  url: string | undefined;
  requiredInFailClosed: boolean;
};

function trimBase(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/+$/, "");
}

export function isFailClosedCatalogBuild(env: EnvMap = process.env): boolean {
  return env.CATALOG_FAIL_CLOSED === "1" || env.CF_PAGES === "1" || env.RELEASE_BUILD === "1";
}

export function resolveCatalogApiBase(env: EnvMap = process.env): string | undefined {
  return trimBase(env.VITE_API_BASE_URL) ?? trimBase(env.CATALOG_API_URL);
}

export function listCatalogSources(env: EnvMap = process.env): CatalogSource[] {
  const apiBase = resolveCatalogApiBase(env);
  return [
    {
      name: "route-catalog",
      envVar: "ROUTE_CATALOG_MANIFEST_URL",
      url: trimBase(env.ROUTE_CATALOG_MANIFEST_URL) ?? (apiBase ? `${apiBase}/api/v1/route-catalog/manifest` : undefined),
      requiredInFailClosed: true,
    },
    {
      name: "tour-packages",
      envVar: "TOUR_PACKAGES_MANIFEST_URL",
      url: trimBase(env.TOUR_PACKAGES_MANIFEST_URL) ?? (apiBase ? `${apiBase}/api/v1/tour-packages/manifest` : undefined),
      requiredInFailClosed: true,
    },
    {
      name: "transfer-routes",
      envVar: "TRANSFER_ROUTES_MANIFEST_URL",
      url: trimBase(env.TRANSFER_ROUTES_MANIFEST_URL) ?? (apiBase ? `${apiBase}/api/v1/transfer-routes/manifest` : undefined),
      requiredInFailClosed: true,
    },
    {
      name: "local-packages",
      envVar: "LOCAL_PACKAGES_MANIFEST_URL",
      url: trimBase(env.LOCAL_PACKAGES_MANIFEST_URL) ?? (apiBase ? `${apiBase}/api/v1/local-packages/manifest` : undefined),
      requiredInFailClosed: true,
    },
    {
      name: "content-manifest",
      envVar: "CONTENT_MANIFEST_URL",
      url: trimBase(env.CONTENT_MANIFEST_URL) ?? (apiBase ? `${apiBase}/api/v1/content/manifest` : undefined),
      requiredInFailClosed: true,
    },
    {
      name: "reviews",
      envVar: "REVIEWS_MANIFEST_URL",
      url: trimBase(env.REVIEWS_MANIFEST_URL) ?? (apiBase ? `${apiBase}/api/v1/public/reviews` : undefined),
      requiredInFailClosed: false,
    },
  ];
}

export function redactCatalogUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.username = "";
    parsed.password = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url.split("?")[0] ?? url;
  }
}

export function isProductionCatalogBuild(env: EnvMap = process.env): boolean {
  if (env.VITE_SITE_MODE === "preview") return false;
  const siteUrl = env.VITE_SITE_URL?.trim();
  if (siteUrl && (siteUrl.includes(".workers.dev") || siteUrl.includes(".pages.dev"))) return false;
  return env.VITE_SITE_MODE === "production" || env.RELEASE_BUILD === "1" || env.CF_PAGES_BRANCH === "main";
}

export function assertNoSilentStagingFallback(env: EnvMap = process.env): void {
  const isProduction = isProductionCatalogBuild(env);
  const resolved = [
    resolveCatalogApiBase(env),
    ...listCatalogSources(env).map((source) => source.url),
  ];
  for (const url of resolved) {
    if (url?.includes(FORBIDDEN_STAGING_HOST) && env.ALLOW_STAGING_CATALOG !== "1" && isProduction) {
      throw new Error(
        `Production catalog source points at ${FORBIDDEN_STAGING_HOST}. Set production VITE_API_BASE_URL (or ALLOW_STAGING_CATALOG=1 only for an explicit preview/staging experiment).`,
      );
    }
  }
}

export function assertFailClosedCatalogEnv(env: EnvMap = process.env): void {
  if (!isFailClosedCatalogBuild(env)) {
    assertNoSilentStagingFallback(env);
    return;
  }
  const sources = listCatalogSources(env);
  const missing = sources.filter((source) => source.requiredInFailClosed && !source.url);
  if (missing.length > 0) {
    const names = missing.map((source) => source.envVar).join(", ");
    throw new Error(
      `Fail-closed catalog build is missing required source URLs (${names}). Set VITE_API_BASE_URL or each *MANIFEST_URL. Refusing to default to ${FORBIDDEN_STAGING_HOST}.`,
    );
  }
  assertNoSilentStagingFallback(env);
}

export function catalogSourceUsesStagingHost(url: string | undefined): boolean {
  return Boolean(url?.includes(FORBIDDEN_STAGING_HOST));
}

export function assertSnapshotPolicy(fetched: boolean, failClosed: boolean, path: string): void {
  if (!fetched && failClosed) {
    throw new Error(
      `[Manifest Builder] Fail-closed build failed to fetch snapshot for ${path}. Refusing to silently preserve stale snapshot in production release.`,
    );
  }
}
