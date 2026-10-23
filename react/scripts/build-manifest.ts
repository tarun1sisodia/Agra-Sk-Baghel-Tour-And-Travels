import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizePublicReviewSnapshot } from "./review-snapshot.ts";
import {
  assertFailClosedCatalogEnv,
  assertSnapshotPolicy,
  isFailClosedCatalogBuild,
  listCatalogSources,
  redactCatalogUrl,
  resolveCatalogApiBase,
} from "./catalog-sources.ts";
// NOTE: react/ must stay self-contained — never import from backend/ here.
// Node's --experimental-strip-types cannot resolve cross-project `.js` -> `.ts`
// imports (ERR_MODULE_NOT_FOUND), which crashed `npm run build`.
// These specs mirror backend/src/modules/fares/fare.catalogue.ts VEHICLES;
// keep them in sync if the catalogue changes (future: move to contracts/).
const VEHICLE_SPECS = [
  { id: "sedan", perKm: 10, alwaysRoundTrip: false },
  { id: "ertiga", perKm: 14, alwaysRoundTrip: false },
  { id: "innova", perKm: 18, alwaysRoundTrip: false },
  { id: "tempo", perKm: 25, alwaysRoundTrip: true },
  { id: "urbania", perKm: 34, alwaysRoundTrip: true },
];

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);
const reactRoot = join(scriptsDir, "..");
const repoRoot = join(reactRoot, "..");
const backendCatalogPath = join(repoRoot, "backend", "src", "modules", "fares", "catalog.data.json");

export type PricingModelType = "oneway" | "day120" | "tempo" | "tour" | "custom";

export interface CompressedRoute {
  o: string;              // Origin
  d: string;              // Destination
  km: number;             // Distance in km (One-Way)
  m: number;              // Duration in minutes
  fs: number | null;      // Fare Sedan (Dzire / Etios)
  fe: number | null;      // Fare Ertiga / SUV
  fi: number | null;      // Fare Innova Crysta
  ft: number | null;      // Tempo Traveller Fare
  fu: number | null;      // Force Urbania Fare
  pm: PricingModelType;   // Pricing Model Flag
  c: string;              // Travel Corridor
  toll: 1 | 0;            // Toll inclusion: 1 = included, 0 = extra
}

function deduplicateItemsBySlug<T>(items: T[], getSlug: (item: T) => string | undefined, label: string): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    const slug = getSlug(item);
    if (!slug) continue;
    if (map.has(slug)) {
      console.warn(`⚠️ [Manifest Builder] Deduplicated duplicate ${label} with slug "${slug}".`);
    }
    map.set(slug, item);
  }
  return Array.from(map.values());
}

export async function buildRouteCatalogAndManifest(): Promise<void> {
  // Read backend single-source-of-truth catalog
  const rawCatalog = readFileSync(backendCatalogPath, "utf-8");
  const catalogRoutes: Record<string, any> = JSON.parse(rawCatalog);

  const manifest: Record<string, CompressedRoute> = {};
  const routesMap = new Map<string, any>();
  const publishedRouteItems: any[] = [];

  assertFailClosedCatalogEnv(process.env);
  const failClosed = isFailClosedCatalogBuild(process.env);
  const apiBase = resolveCatalogApiBase(process.env);
  const catalogSources = Object.fromEntries(listCatalogSources(process.env).map((source) => [source.name, source]));
  if (!apiBase) {
    console.info("[Manifest Builder] No VITE_API_BASE_URL/CATALOG_API_URL; using the local static catalog only (not a release build).");
  }

  async function fetchCatalogJson(url: string): Promise<unknown> {
    const maxAttempts = 3;
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: { accept: "application/json" },
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) {
          throw new Error(`Catalog source ${redactCatalogUrl(url)} returned HTTP ${response.status}`);
        }
        return response.json();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          const delayMs = attempt * 1_000;
          console.warn(`⚠️ [Manifest Builder] Catalog request failed (attempt ${attempt}/${maxAttempts}) for ${redactCatalogUrl(url)}; retrying in ${delayMs}ms.`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
    throw lastError;
  }

  async function loadCatalogSource(name: keyof typeof catalogSources): Promise<unknown | null> {
    const source = catalogSources[name];
    if (!source?.url) {
      if (failClosed) {
        throw new Error(`Fail-closed catalog build is missing ${source?.envVar ?? name}.`);
      }
      return null;
    }
    try {
      return await fetchCatalogJson(source.url);
    } catch (error) {
      if (failClosed) {
        throw error;
      }
      console.warn(`⚠️ [Manifest Builder] ${name} unavailable (${error instanceof Error ? error.message : String(error)}); leaving the existing snapshot untouched.`);
      return null;
    }
  }

  // A single versioned snapshot is the source used by prerender and runtime
  // revalidation. The older per-vertical snapshots below remain compatible
  // with existing page components during the migration.
  if (apiBase) {
    try {
      const unified = await fetchCatalogJson(`${apiBase}/api/v1/public/catalog`);
      writeFileSync(
        join(reactRoot, "src", "data", "live-catalog.snapshot.json"),
        JSON.stringify(unified, null, 2),
        "utf-8",
      );
      console.log("✅ [Manifest Builder] Saved live-catalog.snapshot.json.");
    } catch (error) {
      if (failClosed) throw error;
      console.warn(`⚠️ [Manifest Builder] Unified catalog unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function writeSnapshot(path: string, value: unknown, fetched: boolean): void {
    assertSnapshotPolicy(fetched, failClosed, path);
    if (!fetched) {
      if (existsSync(path)) {
        console.info(`[Manifest Builder] Preserved existing snapshot at ${path} because the remote source was not fetched.`);
        return;
      }
    }
    writeFileSync(path, JSON.stringify(value, null, 2), "utf-8");
  }

  for (const [slug, item] of Object.entries(catalogRoutes)) {
    const fs = item.fares?.sedan != null ? Number(item.fares.sedan) : null;
    const fe = item.fares?.ertiga != null ? Number(item.fares.ertiga) : null;
    const fi = item.fares?.innova != null ? Number(item.fares.innova) : null;
    const ft = item.fares?.tempo != null ? Number(item.fares.tempo) : null;
    const fu = item.fares?.urbania != null ? Number(item.fares.urbania) : null;

    manifest[slug] = {
      o: item.origin,
      d: item.destination,
      km: item.km,
      m: item.durationMins || Math.round((item.km / 55) * 60),
      fs,
      fe,
      fi,
      ft,
      fu,
      pm: item.pricingModel || "oneway",
      c: item.corridor || "Direct Highway Corridor",
      toll: item.toll === 1 ? 1 : 0,
    };

    routesMap.set(slug, {
      id: slug,
      from: item.from,
      to: item.to,
      origin: item.origin,
      destination: item.destination,
      corridor: item.corridor,
      km: item.km,
      duration: item.duration,
      kind: item.kind,
      localLabel: item.localLabel,
      pricingModel: item.pricingModel,
      toll: item.toll === 1 ? 1 : 0,
      fares: {
        sedan: fs,
        ertiga: fe,
        innova: fi,
        tempo: ft,
        urbania: fu,
      },
    });
  }

  // Published admin routes become the customer site's source of truth on the
  // next frontend rebuild. Static JSON remains the safe fallback for local
  // builds and environments where the backend is not reachable.
  const manifestUrl = catalogSources["route-catalog"]?.url;
  const routeCatalogPayload = await loadCatalogSource("route-catalog");
  if (routeCatalogPayload) {
    const payload = routeCatalogPayload as { data?: Array<any> };
    for (const item of payload.data ?? []) {
      if (item.status !== "published") continue;
      publishedRouteItems.push(item);
      const fares = item.faresInr ?? item.fares_inr ?? {};
      const routeSlug = String(item.slug);
      const distanceKm = Number(item.distanceKm ?? item.distance_km ?? 0);
      const durationText = String(item.durationText ?? item.duration_text ?? "");
      const durationMins = Number(durationText.match(/(\d+(?:\.\d+)?)\s*h/i)?.[1] ?? 0) * 60 || Math.round((distanceKm / 55) * 60);
      const sourceCity = String(item.sourceCity ?? item.source_city ?? "");
      const destCity = String(item.destinationCity ?? item.destination_city ?? "Local sightseeing");

      const fs = fares.sedan != null ? Number(fares.sedan) : null;
      const fe = fares.ertiga != null ? Number(fares.ertiga) : null;
      const fi = fares.innova != null ? Number(fares.innova) : null;
      const ft = fares.tempo != null ? Number(fares.tempo) : null;
      const fu = fares.urbania != null ? Number(fares.urbania) : null;

      manifest[routeSlug] = {
        o: sourceCity,
        d: destCity,
        km: distanceKm,
        m: durationMins,
        fs,
        fe,
        fi,
        ft,
        fu,
        pm: item.tripType === "round-trip" ? "day120" : item.tripType === "local-tour" ? "tour" : "oneway",
        c: item.sourceDetail ?? "Direct Highway Corridor",
        toll: item.tollIncluded === false ? 0 : 1,
      };
      routesMap.set(routeSlug, {
        id: routeSlug,
        from: sourceCity,
        to: destCity,
        origin: sourceCity,
        destination: destCity,
        km: distanceKm,
        duration: durationText,
        kind: item.tripType,
        pricingModel: item.tripType === "round-trip" ? "day120" : item.tripType === "local-tour" ? "tour" : "oneway",
        toll: item.tollIncluded === false ? 0 : 1,
        fares: {
          sedan: fs,
          ertiga: fe,
          innova: fi,
          tempo: ft,
          urbania: fu,
        },
      });
    }
    console.log(`✅ [Manifest Builder] Merged published admin route catalog from ${redactCatalogUrl(manifestUrl!)}.`);
  }

  // 1. Emit react/public/routes-manifest.json
  const manifestOutputPath = join(reactRoot, "public", "routes-manifest.json");
  writeFileSync(manifestOutputPath, JSON.stringify(manifest), "utf-8");
  console.log(`✅ [Manifest Builder] Emitted public/routes-manifest.json (${Object.keys(manifest).length} routes) from backend catalog.`);

  // 2. Emit react/src/data/generated-catalog.json
  const allRoutesList = Array.from(routesMap.values());
  const seenRouteSlugs = new Set<string>();
  for (const r of allRoutesList) {
    if (!r.id || r.id.trim() === "") {
      throw new Error("[Manifest Builder] Catalogue parity failed: route must have a non-empty slug id.");
    }
    if (seenRouteSlugs.has(r.id)) {
      throw new Error(`[Manifest Builder] Catalogue parity failed: duplicate route slug "${r.id}".`);
    }
    seenRouteSlugs.add(r.id);
  }

  const getRate = (id: string) => VEHICLE_SPECS.find((v) => v.id === id)?.perKm ?? 10;
  const isAlwaysRoundTrip = (id: string) => Boolean(VEHICLE_SPECS.find((v) => v.id === id)?.alwaysRoundTrip);

  const catalogPayload = {
    routes: allRoutesList,
    vehicles: [
      {
        id: "sedan",
        name: "Sedan",
        klass: "Dzire class",
        seats: 4,
        bags: 2,
        ac: true,
        alwaysRoundTrip: isAlwaysRoundTrip("sedan"),
        tags: ["4+1 SEATS", "AC", "2 BAGS"],
        blurb: "Everyday comfort for city rides, Yamuna Expressway drops, and local sightseeing.",
        perKm: getRate("sedan"),
        rateRange: `₹${getRate("sedan")}–₹${getRate("sedan") + 2}/km`,
        models: ["Maruti Suzuki Dzire", "Toyota Etios", "Hyundai Aura"],
        image: "/assets/fleet/sedan-480.webp",
        suitable: "Couples, airport transfers, 1–4 passengers",
      },
      {
        id: "ertiga",
        name: "Ertiga",
        klass: "6+1 MPV",
        seats: 6,
        bags: 3,
        ac: true,
        alwaysRoundTrip: isAlwaysRoundTrip("ertiga"),
        tags: ["6+1 SEATS", "AC", "3 BAGS"],
        blurb: "A little more room for families without stepping up to a large SUV.",
        perKm: getRate("ertiga"),
        rateRange: `₹${getRate("ertiga")}–₹${getRate("ertiga") + 2}/km`,
        models: ["Maruti Suzuki Ertiga", "Toyota Rumion", "Renault Triber"],
        image: "/assets/fleet/ertiga-480.webp",
        suitable: "Families, 5–6 passengers",
      },
      {
        id: "innova",
        name: "Innova Crysta",
        klass: "6+1 SUV",
        seats: 6,
        bags: 4,
        ac: true,
        alwaysRoundTrip: isAlwaysRoundTrip("innova"),
        tags: ["6+1 SEATS", "AC", "4 BAGS"],
        blurb: "The outstation favourite — plush pushback seats, smooth suspension, and a quiet cabin.",
        perKm: getRate("innova"),
        rateRange: `₹${getRate("innova")}–₹${getRate("innova") + 5}/km`,
        models: ["Toyota Innova Crysta", "Toyota Innova Hycross"],
        image: "/assets/fleet/innova-480.webp",
        suitable: "Longer routes, elders, 4–6 passengers",
      },
      {
        id: "tempo",
        name: "Tempo Traveller",
        klass: "12–17 seater",
        seats: 12,
        bags: 8,
        ac: true,
        alwaysRoundTrip: isAlwaysRoundTrip("tempo"),
        tags: ["12+1 SEATS", "AC", "LUGGAGE BAY"],
        blurb: "Spacious pushback seats, luggage bay, individual AC vents, and ice-box for group travel.",
        perKm: getRate("tempo"),
        rateRange: `₹${getRate("tempo")}–₹${getRate("tempo") + 9}/km`,
        models: ["9-Seater Maharaja", "12-Seater Standard", "16-Seater Executive", "20-Seater Deluxe", "26-Seater Tourer"],
        image: "/assets/fleet/tempo-480.webp",
        suitable: "Family tours, pilgrimage groups, 7–12 passengers",
      },
      {
        id: "urbania",
        name: "Force Urbania",
        klass: "Premium van",
        seats: 16,
        bags: 10,
        ac: true,
        alwaysRoundTrip: isAlwaysRoundTrip("urbania"),
        tags: ["16 SEATS", "PREMIUM", "AC"],
        blurb: "Chauffeur-grade luxury executive travel with airplane-style cabin styling and sealed acoustics.",
        perKm: getRate("urbania"),
        rateRange: `₹${getRate("urbania")}–₹${getRate("urbania") + 4}/km`,
        models: ["Force Urbania 9-Seater VIP", "12-Seater Luxury Cabin", "17-Seater Royal Van"],
        image: "/assets/fleet/urbania-480.webp",
        suitable: "Wedding parties, corporate delegations, 13–16 passengers",
      },
    ],
  };

  const catalogOutputPath = join(reactRoot, "src", "data", "generated-catalog.json");
  writeFileSync(catalogOutputPath, JSON.stringify(catalogPayload, null, 2), "utf-8");
  console.log(`✅ [Manifest Builder] Emitted src/data/generated-catalog.json with ${allRoutesList.length} typed routes.`);

  // Published catalog items are also snapshotted for SSG. Runtime API reads
  // keep the customer UI fresh, while this snapshot gives crawlers complete
  // HTML for catalog pages instead of a client-only loading shell.
  const publishedCatalogPath = join(reactRoot, "src", "data", "generated-published-catalog.json");
  let publishedCatalog: unknown[] = [];
  let publishedCatalogFetched = false;
  if (apiBase) {
    try {
      const payload = await fetchCatalogJson(`${apiBase}/api/v1/public/catalog`) as { data?: any; products?: unknown };
      const rawCatalogItems = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data?.packages)
          ? payload.data.packages
          : Array.isArray(payload.data)
            ? payload.data
          : Array.isArray(payload.products)
            ? payload.products
            : [];
      publishedCatalog = deduplicateItemsBySlug(
        rawCatalogItems,
        (item: any) => item.slug ?? item.id ?? item.code,
        "catalog item"
      );
      publishedCatalogFetched = true;
      console.log(`✅ [Manifest Builder] Snapshotted ${publishedCatalog.length} published catalog items for SSG.`);
    } catch (error) {
      if (failClosed) throw error;
      console.warn(`⚠️ [Manifest Builder] Published catalog snapshot unavailable (${error instanceof Error ? error.message : String(error)}); leaving the existing snapshot untouched.`);
    }
  } else if (failClosed) {
    throw new Error("[Manifest Builder] Fail-closed build is missing API base URL for /api/v1/catalog. Set VITE_API_BASE_URL.");
  }
  writeSnapshot(publishedCatalogPath, publishedCatalog, publishedCatalogFetched);
  writeSnapshot(
    join(reactRoot, "src", "data", "generated-published-routes.json"),
    deduplicateItemsBySlug(publishedRouteItems, (r: any) => r.slug ?? r.id, "published route"),
    Boolean(routeCatalogPayload)
  );

  // Fleet prices sanitizer: canonical 5-key tier mapping (sedan, ertiga, innova, tempo, urbania). No crysta.
  const CANONICAL_FLEET_TIERS = ["sedan", "ertiga", "innova", "tempo", "urbania"] as const;
  const sanitizeFleetPrices = (raw: any): Record<string, number> => {
    const sanitized: Record<string, number> = {};
    if (!raw || typeof raw !== "object") return sanitized;
    for (const tier of CANONICAL_FLEET_TIERS) {
      if (typeof raw[tier] === "number") {
        sanitized[tier] = raw[tier];
      } else if (raw[tier] !== undefined && raw[tier] !== null && !Number.isNaN(Number(raw[tier]))) {
        sanitized[tier] = Number(raw[tier]);
      }
    }
    return sanitized;
  };

  const resolveMediaUrl = (url?: string) => {
    if (!url || !url.trim()) return "";
    const trimmed = url.trim();
    if (trimmed.startsWith("/api/")) return `${apiBase ?? ""}${trimmed}`;
    return trimmed;
  };

  // 1. Tour Packages manifest (GET /api/v1/tour-packages/manifest)
  const tourPackagesManifestUrl = catalogSources["tour-packages"]?.url;
  let publishedTourPackages: any[] = [];
  let tourPackagesFetched = false;
  const tourPackagesPayload = await loadCatalogSource("tour-packages");
  if (tourPackagesPayload) {
      const payload = tourPackagesPayload as { data?: any[] };
      const rawItems = Array.isArray(payload.data) ? payload.data : [];

      publishedTourPackages = deduplicateItemsBySlug(
        rawItems
          .filter((item) => item.status === "published")
          .map((item) => {
            const rawImg = item.coverImage?.url ?? item.coverImage ?? item.cover_image ?? item.coverImageUrl ?? item.cover_image_url ?? item.imageUrl ?? item.image_url ?? item.image ?? (item.gallery?.[0]?.url ?? item.gallery?.[0]);
            let image = resolveMediaUrl(typeof rawImg === "string" ? rawImg : rawImg?.url);
            if (!image) {
              const key = `${item.slug || ""} ${item.name || ""} ${item.packageCode || ""}`.toLowerCase();
              if (key.includes("golden") || key.includes("triangle")) {
                image = "/assets/packages/golden-triangle.webp";
              } else if (key.includes("mathura") || key.includes("vrindavan")) {
                image = "/assets/packages/mathura.webp";
              } else if (key.includes("fatehpur") || key.includes("sikri")) {
                image = "/assets/booking/fatehpur-sikri.webp";
              } else {
                image = "/assets/packages/taj-dawn.webp";
              }
            }
            const gallery = Array.isArray(item.gallery)
              ? item.gallery
                  .map((g: any, idx: number) => {
                    const url = resolveMediaUrl(typeof g === "string" ? g : g.url);
                    const sortOrder = Number(g?.sortOrder ?? g?.sort_order ?? idx);
                    return {
                      url,
                      alt: g?.altText ?? g?.alt ?? item.name,
                      caption: g?.caption ?? item.name,
                      sortOrder,
                    };
                  })
                  .filter((g: any) => Boolean(g.url))
                  .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
              : image ? [{ url: image, alt: item.name, caption: item.name, sortOrder: 0 }] : [];
            return {
              ...item,
              slug: item.slug ?? item.packageCode ?? item.package_code,
              image: image || (gallery[0]?.url ?? ""),
              gallery,
              fleetPrices: sanitizeFleetPrices(item.fleetPrices ?? item.fleet_prices),
            };
          }),
        (item: any) => item.slug,
        "tour package"
      );
      tourPackagesFetched = true;
      console.log(`✅ [Manifest Builder] Snapshotted ${publishedTourPackages.length} published tour packages from ${redactCatalogUrl(tourPackagesManifestUrl!)}.`);
  }
  const publishedTourPackagesPath = join(reactRoot, "src", "data", "generated-published-tour-packages.json");
  writeSnapshot(publishedTourPackagesPath, publishedTourPackages, tourPackagesFetched);

  // 2. Transfer Routes manifest (GET /api/v1/transfer-routes/manifest)
  const transferRoutesManifestUrl = catalogSources["transfer-routes"]?.url;
  let publishedTransferRoutes: any[] = [];
  const transferPayload = await loadCatalogSource("transfer-routes");
  if (transferPayload) {
      const payload = transferPayload as { data?: any[] };
      const rawItems = Array.isArray(payload.data) ? payload.data : [];
      publishedTransferRoutes = deduplicateItemsBySlug(
        rawItems
          .filter((item) => item.status === "published")
          .map((item) => ({
            ...item,
            slug: item.slug ?? item.routeCode ?? item.route_code,
            fleetPrices: sanitizeFleetPrices(item.fleetPrices ?? item.fleet_prices),
          })),
        (item: any) => item.slug,
        "transfer route"
      );
      console.log(`✅ [Manifest Builder] Snapshotted ${publishedTransferRoutes.length} published transfer routes from ${redactCatalogUrl(transferRoutesManifestUrl!)}.`);
  }
  writeSnapshot(join(reactRoot, "src", "data", "generated-published-transfer-routes.json"), publishedTransferRoutes, Boolean(transferPayload));

  // 3. Local Packages manifest (GET /api/v1/local-packages/manifest)
  const localPackagesManifestUrl = catalogSources["local-packages"]?.url;
  let publishedLocalPackages: any[] = [];
  const localPayload = await loadCatalogSource("local-packages");
  if (localPayload) {
      const payload = localPayload as { data?: any[] };
      const rawItems = Array.isArray(payload.data) ? payload.data : [];
      publishedLocalPackages = deduplicateItemsBySlug(
        rawItems
          .filter((item) => item.status === "published")
          .map((item) => {
            const rawImg = item.coverImage?.url ?? item.coverImage ?? item.cover_image ?? item.coverImageUrl ?? item.cover_image_url ?? item.imageUrl ?? item.image_url ?? item.image ?? (item.gallery?.[0]?.url ?? item.gallery?.[0]);
            let image = resolveMediaUrl(typeof rawImg === "string" ? rawImg : rawImg?.url);
            if (!image) {
              const key = `${item.slug || ""} ${item.name || ""} ${item.packageCode || ""}`.toLowerCase();
              if (key.includes("fort") || key.includes("mughal")) {
                image = "/assets/packages/agra-fort.webp";
              } else if (key.includes("mathura") || key.includes("vrindavan")) {
                image = "/assets/packages/mathura.webp";
              } else if (key.includes("fatehpur") || key.includes("sikri")) {
                image = "/assets/booking/fatehpur-sikri.webp";
              } else {
                image = "/assets/booking/taj-mahal.webp";
              }
            }
            const gallery = Array.isArray(item.gallery)
              ? item.gallery
                  .map((g: any, idx: number) => {
                    const url = resolveMediaUrl(typeof g === "string" ? g : g.url);
                    const sortOrder = Number(g?.sortOrder ?? g?.sort_order ?? idx);
                    return {
                      url,
                      alt: g?.altText ?? g?.alt ?? item.name,
                      caption: g?.caption ?? item.name,
                      sortOrder,
                    };
                  })
                  .filter((g: any) => Boolean(g.url))
                  .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
              : image ? [{ url: image, alt: item.name, caption: item.name, sortOrder: 0 }] : [];
            return {
              ...item,
              slug: item.slug ?? item.packageCode ?? item.package_code,
              image: image || (gallery[0]?.url ?? ""),
              gallery,
              fleetPrices: sanitizeFleetPrices(item.fleetPrices ?? item.fleet_prices),
            };
          }),
        (item: any) => item.slug,
        "local package"
      );
      console.log(`✅ [Manifest Builder] Snapshotted ${publishedLocalPackages.length} published local packages from ${redactCatalogUrl(localPackagesManifestUrl!)}.`);
  }
  writeSnapshot(join(reactRoot, "src", "data", "generated-published-local-packages.json"), publishedLocalPackages, Boolean(localPayload));

  // 4. Combined Content manifest (GET /api/v1/content/manifest)
  const contentManifestUrl = catalogSources["content-manifest"]?.url;
  let publishedContent: Record<string, any> = {
    cancellationPolicies: [],
    monuments: [],
    petPolicy: null,
    companyProfile: null,
    dossierSignoffs: [],
  };
  const contentPayload = await loadCatalogSource("content-manifest");
  if (contentPayload) {
      const payload = contentPayload as { data?: Record<string, any> };
      if (payload.data && typeof payload.data === "object") {
        publishedContent = payload.data;
      }
      console.log(`✅ [Manifest Builder] Snapshotted content manifest (${Object.keys(publishedContent).length} sections) from ${redactCatalogUrl(contentManifestUrl!)}.`);
  }
  writeSnapshot(join(reactRoot, "src", "data", "generated-published-content.json"), publishedContent, Boolean(contentPayload));

  // 5. Customer Reviews snapshot (GET /api/v1/public/reviews)
  const reviewsManifestUrl = catalogSources["reviews"]?.url;
  let publishedReviews: any[] = [];
  let reviewsFetched = false;
  const reviewsPayload = await loadCatalogSource("reviews");
  if (reviewsPayload) {
    publishedReviews = normalizePublicReviewSnapshot(reviewsPayload);
    reviewsFetched = true;
    console.log(`✅ [Manifest Builder] Snapshotted ${publishedReviews.length} published reviews from ${redactCatalogUrl(reviewsManifestUrl!)}.`);
  }
  writeSnapshot(join(reactRoot, "src", "data", "generated-published-reviews.json"), publishedReviews, reviewsFetched);
}

await buildRouteCatalogAndManifest();
