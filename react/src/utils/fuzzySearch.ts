/**
 * @file fuzzySearch.ts — State 6: No Search Results (Typo Correction + Popular Alternatives).
 * Handles common traveler typos (e.g., "ajra to dehli", "vrandavan", "mathra", "jaipr")
 * and returns actionable suggestions plus popular fallback routes.
 */

import type { FuzzySearchResponse } from "../contracts/ux-states.js";

export interface SearchableCatalogItem {
    id: string;
    category: "outstation" | "local_package" | "transfer" | "tour_package";
    name: string;
    slug: string;
    origin?: string;
    destination?: string;
    startingPriceInr: number;
    keywords?: string[];
}

const CITY_AND_MONUMENT_TYPO_MAP: Record<string, string> = {
    ajra: "agra",
    agrah: "agra",
    aagra: "agra",
    dehli: "delhi",
    dilli: "delhi",
    deli: "delhi",
    dlhi: "delhi",
    newdehli: "new delhi",
    noiada: "noida",
    nodia: "noida",
    gurgoan: "gurugram",
    gurgaon: "gurugram",
    gugaon: "gurugram",
    jaipr: "jaipur",
    jaypur: "jaipur",
    japur: "jaipur",
    mathra: "mathura",
    matura: "mathura",
    mthura: "mathura",
    vrandavan: "vrindavan",
    vrindavn: "vrindavan",
    brindavan: "vrindavan",
    fatehpur: "fatehpur sikri",
    fathepursikri: "fatehpur sikri",
    sikri: "fatehpur sikri",
    tajmhal: "taj mahal",
    tajmahal: "taj mahal",
    varansi: "varanasi",
    banaras: "varanasi",
    luknow: "lucknow",
    lko: "lucknow",
    haridwr: "haridwar",
    rishkesh: "rishikesh",
    igi: "delhi airport",
    airport: "igi airport transfer",
    cantt: "agra cantt station",
};

export const DEFAULT_POPULAR_ALTERNATIVES: FuzzySearchResponse["popular_alternatives"] = [
    {
        id: "pop-agra-delhi",
        category: "outstation",
        name: "Agra to New Delhi / IGI Airport (Yamuna Expressway)",
        slug: "agra-to-delhi",
        starting_price_inr: 3500,
        badge_label: "Most Booked Corridor",
    },
    {
        id: "pop-taj-sunrise",
        category: "tour_package",
        name: "Taj Mahal Sunrise & Agra Fort Private Tour",
        slug: "taj-mahal-sunrise-tour",
        starting_price_inr: 2200,
        badge_label: "Bestseller Day Tour",
    },
    {
        id: "pop-mathura-vrindavan",
        category: "tour_package",
        name: "Agra to Mathura & Vrindavan Same-Day Darshan",
        slug: "mathura-vrindavan-day-tour",
        starting_price_inr: 2800,
        badge_label: "Pilgrimage Favorite",
    },
    {
        id: "pop-agra-jaipur",
        category: "outstation",
        name: "Agra to Jaipur (via Fatehpur Sikri)",
        slug: "agra-to-jaipur",
        starting_price_inr: 4200,
        badge_label: "Golden Triangle Route",
    },
];

export function levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,      // deletion
                dp[i][j - 1] + 1,      // insertion
                dp[i - 1][j - 1] + cost // substitution
            );
        }
    }
    return dp[m][n];
}

function normalizeQueryTokens(rawQuery: string): { correctedQuery: string; wasCorrected: boolean } {
    const tokens = rawQuery
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);

    let wasCorrected = false;
    const correctedTokens = tokens.map((token) => {
        if (CITY_AND_MONUMENT_TYPO_MAP[token]) {
            wasCorrected = true;
            return CITY_AND_MONUMENT_TYPO_MAP[token];
        }
        return token;
    });

    const joined = correctedTokens
        .join(" ")
        .replace(/\b([a-z])/g, (char) => char.toUpperCase());

    return { correctedQuery: joined, wasCorrected };
}

export function searchCatalogWithTypoTolerance(
    rawQuery: string,
    catalog: SearchableCatalogItem[],
    popularFallbacks = DEFAULT_POPULAR_ALTERNATIVES
): {
    matches: SearchableCatalogItem[];
    fuzzyMeta: FuzzySearchResponse;
} {
    const cleanQuery = rawQuery.trim();
    if (!cleanQuery) {
        return {
            matches: catalog,
            fuzzyMeta: {
                original_query: "",
                exact_match_count: catalog.length,
                did_you_mean: null,
                suggested_query_slug: null,
                popular_alternatives: popularFallbacks,
            },
        };
    }

    const lowerQuery = cleanQuery.toLowerCase();

    // 1. Direct substring match
    const exactMatches = catalog.filter((item) => {
        const haystack = [
            item.name,
            item.slug.replace(/-/g, " "),
            item.origin ?? "",
            item.destination ?? "",
            ...(item.keywords ?? []),
        ]
            .join(" ")
            .toLowerCase();
        return haystack.includes(lowerQuery);
    });

    if (exactMatches.length > 0) {
        return {
            matches: exactMatches,
            fuzzyMeta: {
                original_query: cleanQuery,
                exact_match_count: exactMatches.length,
                did_you_mean: null,
                suggested_query_slug: null,
                popular_alternatives: popularFallbacks,
            },
        };
    }

    // 2. Token alias normalization (e.g., "ajra to dehli" -> "Agra To Delhi")
    const { correctedQuery, wasCorrected } = normalizeQueryTokens(cleanQuery);
    if (wasCorrected) {
        const lowerCorrected = correctedQuery.toLowerCase();
        const aliasMatches = catalog.filter((item) => {
            const haystack = [item.name, item.slug.replace(/-/g, " "), item.origin ?? "", item.destination ?? ""]
                .join(" ")
                .toLowerCase();
            return haystack.includes(lowerCorrected);
        });

        return {
            matches: aliasMatches,
            fuzzyMeta: {
                original_query: cleanQuery,
                exact_match_count: 0,
                did_you_mean: aliasMatches[0]?.name ?? correctedQuery,
                suggested_query_slug: aliasMatches[0]?.slug ?? null,
                popular_alternatives: popularFallbacks,
            },
        };
    }

    // 3. Levenshtein distance match against catalog names & destinations
    let bestCandidate: SearchableCatalogItem | null = null;
    let bestDistance = Infinity;

    for (const item of catalog) {
        const targets = [
            item.name.toLowerCase(),
            item.slug.replace(/-/g, " ").toLowerCase(),
            (item.destination ?? "").toLowerCase(),
        ].filter(Boolean);

        for (const target of targets) {
            const dist = levenshteinDistance(lowerQuery, target);
            const maxAllowed = Math.max(2, Math.floor(target.length * 0.3));
            if (dist <= maxAllowed && dist < bestDistance) {
                bestDistance = dist;
                bestCandidate = item;
            }
        }
    }

    return {
        matches: bestCandidate ? [bestCandidate] : [],
        fuzzyMeta: {
            original_query: cleanQuery,
            exact_match_count: 0,
            did_you_mean: bestCandidate ? bestCandidate.name : null,
            suggested_query_slug: bestCandidate ? bestCandidate.slug : null,
            popular_alternatives: popularFallbacks,
        },
    };
}