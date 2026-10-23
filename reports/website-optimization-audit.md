# Website Optimization Audit and Implementation Report

**Repository:** `tarun1sisodia/Agra-Sk-Baghel-Tour-And-Travels`  
**Working branch:** `feat/website-seo-performance-optimization`  
**Audit date:** 2026-10-22  
**Scope:** All 50 checks in the supplied website optimization checklist, the customer-site source/build, and read-only production HTTP checks.

## Executive summary

The checklist was checked end-to-end. This branch implements the safe source-level corrections that did not require editing design-locked components or changing live production accounts. The main changes cover private-route indexing, the homepage hero preload, canonical/legacy route cleanup, 404 recovery, monument links, visible refund timelines, contact-map access, favicons, and stronger build-time SEO checks.

This is **not a claim that all 50 checklist items are complete**. Several items require a browser-authenticated Kane session, production release, Cloudflare/Search Console/Google Business Profile access, verified operational facts, or explicit authorization to change locked design. Performance-related work that would alter the locked homepage/chrome or global typography was not forced through.

The live apex homepage and CSS were observed returning Brotli compression. The live `www` host still returned 200 without redirecting to the canonical apex, while HTTP apex redirected to HTTPS. Production also still served 404s for the newly added icon paths at audit time; the branch changes have not been deployed. PageSpeed Insights returned HTTP 429, so no fresh Lighthouse score or Core Web Vitals measurement is claimed.

## Implemented in this branch

- Prerendered private utility pages are marked `noindex,nofollow`; the artifact validator now checks SEO metadata and title uniqueness for indexable sitemap pages.
- Removed duplicate legal aliases from the indexable sitemap, retained canonical redirect behavior for legacy legal and Mathura paths, and added path-level redirects where appropriate. Sitemap `lastmod` values were not fabricated.
- Added responsive AVIF preload hints for the first homepage hero slide. Mobile and desktop preload candidates are generated from the same `HOME_HERO_SLIDES` data as the rendered picture sources and are covered by a build-artifact assertion.
- Replaced mismatched monument-card slugs with the published-content slug algorithm, removed misleading/unverified thumbnails, and added generated-page link checks.
- Improved the 404 page: its search now filters real recovery links; canonical recovery paths, home, phone, and WhatsApp actions are present; touch controls meet a 48px minimum; the vehicle alt text and sizing are accurate; unverified “active telemetry”/“dispatch guarantee”/physical-station claims were removed.
- Added a lazy, titled map embed while retaining directions/contact routes; displayed refund timelines from the existing policy data; added branded ICO/PNG/Apple touch icons and head references.
- Extended build validation for hero preloads, title length/uniqueness, image-alt coverage (with the decorative hidden hero explicitly allowlisted), contact-map markup, visible refund timelines, and 404 destinations/contact actions.
- Added the pinned Kane CLI development package and its repository skill/instructions. The read-only preflight was attempted, but a real-browser Kane run was not completed because this sandbox did not have an authenticated Kane session.

## Checklist status: all 50 items

| # | Current status | Evidence and remaining work |
|---:|---|---|
| 1 | **Fixed in branch; build-checked** | Private utility routes, review pages, and redirect artifacts are noindex; the SEO artifact validator checks indexable artifacts. Confirm the deployed HTML after release. |
| 2 | **Pass** | `robots.txt` allows public crawling and keeps only intentional utility exclusions. Confirm the served copy after deployment. |
| 3 | **Pass** | `robots.txt` declares the canonical HTTPS sitemap URL. Production returned 200 for `robots.txt` and `sitemap.xml`. |
| 4 | **Partial by design** | Sitemap locs are canonical; some pages still lack `lastmod`. Google makes `lastmod` optional and says it must be accurate, so unknown dates were not replaced with build timestamps. A source-owned page-change manifest would be needed to complete the checklist literally. |
| 5 | **Pass** | Canonicals are generated from the approved origin and indexable sitemap URLs are checked against page canonicals. |
| 6 | **Open: production configuration** | Live apex HTTP redirects to HTTPS, but `https://www...` returned 200 without a `Location`; HTTP `www` redirects to HTTPS `www`. Configure the documented Cloudflare Bulk Redirect (`www` to apex, preserve path/query) and verify all host variants. No live redirect rule was changed. |
| 7 | **Fixed in branch; live release pending** | 404 has a direct `tel:` CTA, WhatsApp CTA, and canonical links. The baseline production unknown-path request returned HTTP 404 with branded content, but production has not received this branch. |
| 8 | **Partial** | Canonical slash convention is retained and 404 links were corrected; other source links still use noncanonical paths/query booking URLs. Do a full route-aware source/build link audit and normalize non-utility links. |
| 9 | **Partial** | Monument cards now use the same published slug logic as prerendering; 404 recovery links target existing artifacts and are asserted during build. A complete crawler for every dynamic, modal, query, and catalog link remains to be implemented. |
| 10 | **Pass for indexable URLs** | Sitemap/canonical marketing URLs are lowercase, slash-terminated, and query-free. Booking/search/review query and token URLs remain intentional utility flows and must stay out of indexable canonicals. |
| 11 | **Unverified** | SSG and client hydration differ in their render entrypoints. No real browser console/hydration run completed. Run route-by-route with an authenticated Kane session and fail on hydration warnings. |
| 12 | **Open** | Main CSS remains a render-blocking stylesheet. Critical-CSS extraction/deferred CSS was not attempted because it is a wider rendering/layout change requiring visual/browser verification. |
| 13 | **Fixed in branch; build-checked** | The homepage now preloads matching first-slide AVIF responsive candidates for mobile and desktop; the validator checks media, format, and srcset values. Verify the network waterfall after deployment. |
| 14 | **Partial** | Some gallery/fleet/catalog images already lazy-load and decode asynchronously, and monument-card images are improved. Fleet/detail/carousel image coverage is not universal; add a shared policy and inspect each route. |
| 15 | **Open** | The audit found 114 JPG/PNG assets and 325 assets over 40 KiB in the existing build inventory. No bulk asset conversion was performed; convert only production-served images with visual/source review and appropriate responsive sizes. |
| 16 | **Open/partial** | Several source images still lack intrinsic `width`/`height`; the 404 vehicle image now declares its actual dimensions. Add dimensions or metadata-driven image components across remaining pages. |
| 17 | **Partial** | GTM is interaction/idle deferred. No Clarity loader or ad pixels were found, and no consent/production tracker configuration was verified. Confirm whether these trackers are intentionally absent or configure them through the approved consent workflow. |
| 18 | **Partial: production evidence** | Live apex HTML and CSS returned Brotli `Content-Encoding: br`. Gzip fallback and broader asset/header coverage were not established, and this does not substitute for field Core Web Vitals. |
| 19 | **Fixed in branch; build-checked** | Duplicate legal aliases are redirected/noindexed and removed from the sitemap; the artifact validator now enforces unique titles of at most 60 characters on indexable sitemap pages. |
| 20 | **Open; checklist criterion needs correction** | Many baseline descriptions were short or reused. Google does not require a fixed 140–155-character length or a phone number on every description; descriptions should be unique and useful. Route-specific copy still needs editorial work, but the checklist’s fixed-length/phone rule is not a Google requirement. |
| 21 | **Partial** | Existing content has one H1 per indexable page; service/city intent is not consistently explicit, especially on the homepage. Improve copy page-by-page without changing locked homepage composition. |
| 22 | **Partial/open** | Heading-level skips were found in multiple generated pages. Terms/legal and other unlocked templates can be corrected, but the universal package template is design-locked and requires explicit approval before markup changes. Run a fresh heading-sequence audit after fixes. |
| 23 | **Pass with documented exception** | Indexable images now require non-empty alt text except the aria-hidden decorative homepage hero, which is intentionally empty-alt and allowlisted in the validator. |
| 24 | **Open** | The supplied target phrases do not consistently appear in the first 150 visible words. Add natural, page-specific copy to homepage/package templates; do not stuff keyword strings into metadata. |
| 25 | **Pass** | Open Graph title, description, image, and canonical URL are generated; artifact checks cover canonical metadata. Validate social crawlers after production deployment. |
| 26 | **Pass** | Twitter/X summary-large-image metadata is present in generated indexable pages. Recheck social-card fetches after deployment. |
| 27 | **Fixed in branch; live release pending** | Added favicon ICO, 192px PNG, Apple touch icon, and HTML declarations alongside the SVG. Production still returned 404 for these new paths before deployment. |
| 28 | **Partial** | The 404 page’s controls and suggestion links now have 48px minimum height. Homepage account dismissal and mobile header controls remain 44px and are in locked HomePage/chrome components; changing them requires explicit user approval under `DESIGN_LOCKS.md`. |
| 29 | **Partial; design-system conflict** | The 404 search input is now 16px. The site’s master design tokens intentionally use smaller body/caption sizes; raising global booking/mobile typography to 16px would alter the locked design system and needs explicit approval or a narrowly scoped exception. |
| 30 | **Partial** | Main header/sticky/radial/SEO CTAs use `tel:`. The 404 page now also links every displayed phone number. A site-wide scan of every dynamic/template phone occurrence remains. |
| 31 | **Pass** | Prominent WhatsApp CTAs with prefilled messages already exist; 404 WhatsApp recovery is retained. Standardize the exact message text across all entrypoints if desired. |
| 32 | **Partial** | Terms and some route pages explain tolls, parking, permits, and allowances, but fuel/inclusion semantics are not consistent across every fare/package card. Build a verified route/package inclusions matrix; do not infer fare promises. |
| 33 | **Partial** | Existing driver/vehicle trust signals remain. The 404 page no longer makes unsupported telemetry/guarantee/station claims. No operational on-time SLA was supplied, so no punctuality guarantee was invented. |
| 34 | **Partial** | No Lorem Ipsum/demo/javascript placeholder was found. Some catalog checks cannot run without manifest/API environment variables; some disabled product actions are intentional. Add route-aware link/action checks and run catalog-source checks in the configured environment. |
| 35 | **Partial/external** | Website contact/schema NAP values are centralized. Matching Google Business Profile and third-party directory records were not available; verify those records character-for-character with the owner. |
| 36 | **Fixed in branch; live release pending** | Contact page now has a lazy, accessible titled map embed and retains directions. Confirm it renders in an authorized browser after release. |
| 37 | **Pass** | Contact page and shared footer expose phone/email/address/hours and the contact route is prerendered. Full address visibility on the contact body can be improved, but core contact access exists. |
| 38 | **Pass** | Dedicated privacy policy exists with substantive data, retention, contact, and rights disclosures. Reconcile it with actual provider practices when those change. |
| 39 | **Fixed in branch; build-checked** | Existing `refundTimelineNote` policy data is now rendered visibly beside applicable refundable slabs and checked in generated terms HTML. Validate the live/API-backed policy after deployment. |
| 40 | **Pass** | Agra Cantt Railway Station, Taj East Gate, and Kheria Airport appear in customer content/generated pages. |
| 41 | **Partial** | Local JSON-LD parses and contains business/schema data. Google Rich Results Test and Search Console validation were not run; local syntax is not proof of Google eligibility. |
| 42 | **Unverified/external** | No Google Search Console domain verification was evidenced. Add the exact owner-issued DNS TXT record and verify in GSC; the existing Bing tag is not Google verification. |
| 43 | **Unverified/external** | The sitemap is generated and exposed by robots.txt, but GSC submission/status was not checked. Submit it after domain verification and production deployment. |
| 44 | **Unverified/external** | No GSC Live URL inspection/render report was available. Run URL Inspection for the deployed canonical homepage. |
| 45 | **Unverified/external** | No GSC indexing request was evidenced. Request indexing only after the live URL is fetchable and indexable. |
| 46 | **Unverified/external** | GTM code exists and is deferred, but no GA4 `G-` ID, published tag configuration, Realtime result, or browser/tag-debugger evidence was found. Configure and verify in the actual GTM/GA4 property. |
| 47 | **Partial** | Source instrumentation dispatches `phone_click` and `whatsapp_click` when `gtag` exists. GTM mappings, successful network delivery, and GA4 DebugView/Realtime were not verified. |
| 48 | **Unverified/external** | No owner dashboard evidence for the Google Business Profile website URL exists. Set/verify the canonical HTTPS site link in the verified profile. |
| 49 | **Unverified/external** | Search Console Security Issues and Manual Actions dashboards were not accessed. Check both after verifying the property. |
| 50 | **Unverified/external** | No week-one Search Console review was scheduled. Schedule it after the actual launch date; the existing five-minute uptime check is not a substitute. |

## Production checks performed (read-only)

On 2026-10-22, direct HTTP requests (not a browser) established the following baseline:

- `https://agraskbagheltourandtravels.com/` and its CSS returned HTTP 200 with Brotli compression.
- `https://www.agraskbagheltourandtravels.com/` returned HTTP 200 and no redirect. HTTP apex redirected to HTTPS apex; HTTP `www` redirected only to HTTPS `www`.
- `/robots.txt` and `/sitemap.xml` returned HTTP 200. The live sitemap snapshot contained 54 URL entries; the branch build generated 63 after canonical alias cleanup. This branch has not been deployed, so the counts are expected to differ.
- A random unknown path returned HTTP 404 with branded content. The updated 404 content in this branch is not yet live.
- Live `/favicon.ico`, `/icon-192.png`, and `/apple-touch-icon.png` returned 404 before this branch is deployed; the SVG favicon returned 200.
- PageSpeed Insights returned HTTP 429. No current Lighthouse score or Core Web Vitals values are asserted.

## Verification and browser-test status

The repository’s full command is `npm run verify` (frontend/backend typechecks, backend tests, customer/admin/backend builds, and artifact validation). The final run completed successfully: 34 backend test files / 409 tests, 41 customer source tests, 5 admin tests, and 8 SEO lifecycle/origin checks all passed; customer, admin, and backend production builds succeeded. The SEO artifact validator passed with 101 HTML files and 63 sitemap URLs at the canonical origin. `git diff --check` is clean after regeneration of the tracked sitemap and restoration of the build-only release stamp.

Kane CLI is installed as a pinned development dependency with the official skill documented in the repository. Its read-only preflight was attempted, but it reported “Not logged in”; no real-browser E2E result is claimed. The catalog-source check also requires manifest/API environment variables that were not configured in this sandbox. The repository-prescribed Beacon graph CLI/MCP was also unavailable, so no Beacon context or roadmap registration was made.

## Actions that still require an owner or deployment

1. Configure the Cloudflare Bulk Redirect from `www` to the HTTPS apex, preserving path and query, then verify all scheme/host variants.
2. Deploy this branch before interpreting production favicon, 404, hero preload, map, sitemap, or visible refund behavior as fixed.
3. Authenticate Kane from an authorized environment and run browser E2E/hydration/mobile checks; do not send access keys in chat.
4. Verify Google Search Console, submit the sitemap, inspect the live URL, request indexing, check Security/Manual Actions, and schedule the week-one review.
5. Verify GA4/GTM events and Google Business Profile in the owner accounts.
6. Supply authoritative fare inclusions and operational evidence before publishing fuel/on-time guarantees or matching external directory claims.
7. Explicitly approve any change to the locked home/chrome/booking/package template or the global typography system.

## Guidance sources

- [Google Search Central: snippets and meta descriptions](https://developers.google.com/search/docs/appearance/snippet) — no fixed description length or phone-number requirement.
- [Google Search Central: sitemap building](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) — `lastmod` should be accurate and significant, not a build timestamp.
- [Google Search Central: Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals) — good thresholds: LCP ≤ 2.5 s, INP < 200 ms, CLS < 0.1; no current measurements were obtained here.
- [Cloudflare Pages: www redirect guidance](https://developers.cloudflare.com/pages/how-to/www-redirect/) — Bulk Redirect configuration for canonical host forwarding.
- [Cloudflare Pages: redirects](https://developers.cloudflare.com/pages/configuration/redirects/) — `_redirects` handles path redirects, not a hostname-wide redirect.
