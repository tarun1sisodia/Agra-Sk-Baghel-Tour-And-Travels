# Canonical SEO Remediation — Implementation Report

**Repository:** `tarun1sisodia/ArenaAI`  
**Base branch:** `main`  
**Inspected baseline:** `32b7be227d8cf76702e1bade0691e66bae8bf898`  
**Implementation branch:** `fix/canonical-origin-hindi-indexing`  
**Pull request:** [#71](https://github.com/tarun1sisodia/ArenaAI/pull/71)  
**Status:** Implementation opened for review; CI verification pending.

## Findings confirmed from source

1. `react/src/config.ts`, `react/src/components/seo/SeoHead.tsx`, and `react/scripts/generate-sitemap.ts` independently defaulted to a Cloudflare `workers.dev` origin.
2. The sitemap and SEO metadata advertised Hindi alternate URLs even though the prerender route manifest only generated English marketing routes.
3. The sitemap contained both `/` and `/en/` as home entries despite the existing compatibility redirect for the latter.
4. `RentalPage.tsx` retained Devanagari UI copy and `isHi` branches. A successful request without a server-provided reference could also display the synthetic `RNT-CONFIRMED` value.
5. Dynamic snapshot entries could include archived items in the sitemap while the prerender route collection filtered to published records.

## Changes in this branch

- Added `react/src/config/siteOrigin.ts` as the shared origin and Hindi-indexing policy.
- Added `react/scripts/validate-site-config.ts`; release and preview builds require an explicit `VITE_SITE_URL`, while production release mode requires the approved HTTPS origin.
- Rewired `react/src/config.ts`, `react/src/components/seo/SeoHead.tsx`, `react/scripts/generate-sitemap.ts`, and `react/scripts/prerender.ts` to share the origin policy and avoid advertising incomplete Hindi pages by default.
- Removed the duplicate `/en/` sitemap home entry and constrained catalog sitemap records to published content.
- Added `react/scripts/validate-seo-artifacts.ts` to validate built canonical tags, Open Graph URLs, sitemap and hreflang origins, robots sitemap URL, and sitemap-to-artifact parity.
- Changed `react/src/pages/RentalPage.tsx` to use English copy without language-dependent UI branches. The language prop remains accepted for route/caller compatibility.
- Removed the invented rental confirmation reference. A reference is displayed only when a non-empty value is returned by the API.
- Added tests for origin policy, Hindi-indexing policy, rental copy/reference behavior, and sitemap assertions.
- Added release settings to `.github/workflows/main-monitor.yml` and documented public Vite environment variables in `react/.env.example`.

## Verification and boundaries

- Source-level inspection was performed against the GitHub branch after the edits. The Rental page content guard reports no Devanagari characters, no `isHi` references, and no `RNT-CONFIRMED` literal in that file.
- Automated GitHub Actions runs were started by PR #71. Final build/test results must be checked before merge.
- A local install/build/test run was **not completed**: the local environment could not resolve GitHub during repository cloning.
- No production database migration, production-data mutation, deployment, live browser check, or production hostname fetch was performed.

## Release configuration required

The production customer build must receive:

```text
VITE_SITE_URL=https://agraskbagheltourandtravels.com
VITE_SITE_MODE=production
VITE_HINDI_INDEXING_ENABLED=false
```

Hindi routes are not deleted; they are simply not advertised to search engines until the corresponding localized content and built artifacts are complete.
