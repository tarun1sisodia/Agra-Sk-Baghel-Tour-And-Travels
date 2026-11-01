# Frontend Architecture — Agra SK Baghel Tour & Travels

## 1. Executive Summary & Purpose

This document describes the frontend architecture for the customer-facing React application (`react/`). It documents the correct techniques used to build a high-performance, SEO-optimized, static-first travel booking website that serves as the primary customer interface for booking cabs, tours, and packages.

### Core Philosophy

- **SSG-First with Zero-Spinner Hydration**: All marketing pages are pre-rendered at build time; hydration happens without loading spinners
- **Server-Authoritative Business Logic**: Fares, pricing, and booking creation happen exclusively on the backend
- **Progressive Enhancement**: Static HTML with client-side hydration for interactivity
- **Type-First Development**: Zod contracts shared between frontend and backend ensure type safety
- **Performance Budgets**: Strict PageSpeed guardrails enforced at build time

### Document Registry & Precedence

| Document | Purpose |
|----------|---------|
| [`FRONTEND_RULES.md`](FRONTEND_RULES.md) | Master architectural standard, component rules, typography scale |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Build commands, environment variables, release order |
| [`docs/CUSTOMER_SITE_PRD.md`](docs/CUSTOMER_SITE_PRD.md) | Product requirements and user flows |
| This document | Technical architecture and implementation patterns |

---

## 2. Technology Stack

### Core Framework & Build Tools

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19.1.1 | UI framework with concurrent rendering |
| `vite` | 7.1.3 | Build tool with HMR and optimized production builds |
| `typescript` | 5.8.2 | Type-safe development |
| `tailwindcss` | 4.3.3 | Utility-first CSS framework |
| `motion` | 13.4.4 | Animation library (Framer Motion) |

### Data Validation & Contracts

| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | 3.25.76 | Runtime type validation and schema definition |
| `zod-validation-error` | 1.3.1 | Human-readable validation error messages |

### State Management & Data Fetching

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | 2.57.4 | Supabase client for authentication and database |
| `lucide-react` | 1.48.0 | Icon library |

### Development & Testing

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | 7.1.3 | Development server with HMR |
| `vitest` | 3.0.7 | Unit and integration testing |
| `@testsprite/testsprite-cli` | 0.15.0 | E2E testing framework |

### Build Scripts

| Script | Purpose |
|--------|---------|
| `validate-site-config` | Validates site configuration before build |
| `tsc` | TypeScript compilation |
| `build-manifest` | Generates catalog manifests from database exports |
| `vite build` | Production build with SSG support |
| `prerender` | Pre-renders all marketing pages to static HTML |
| `validate-seo-artifacts` | Validates SEO metadata and sitemap |
| `validate-pagespeed-guardrails` | Enforces PageSpeed performance budgets |
| `generate-release` | Generates release metadata for deployment |

---

## 3. Directory Structure

```
react/
├── src/
│   ├── app/                    # Application entry points and routing
│   │   ├── App.tsx            # Main React component with lazy loading
│   │   ├── ServerApp.tsx      # Server-side rendering entry point
│   │   ├── routes.tsx         # Route definitions and marketing hubs
│   │   ├── prefetch.ts        # Resource prefetching utilities
│   │   └── SeoHead.tsx        # SEO metadata manager (re-export)
│   ├── auth/                  # Authentication context and helpers
│   │   └── customerAuth.tsx   # Customer authentication provider
│   ├── components/            # Reusable UI components
│   │   ├── seo/               # SEO-related components
│   │   │   └── SeoHead.tsx    # Dynamic SEO head & metadata manager
│   │   ├── badges.tsx         # Status badges and indicators
│   │   ├── cards.tsx          # Card components for content
│   │   ├── Chrome.tsx         # Layout chrome (header, footer, navigation)
│   │   ├── ErrorBoundary.tsx  # Error boundary component
│   │   ├── OAuthErrorBanner.tsx # OAuth error display
│   │   ├── reveal.tsx         # Reveal animation component
│   │   ├── RichLandingPage.tsx # Rich landing page template
│   │   └── avatar/            # Buddy avatar widget
│   ├── config/                # Configuration files
│   ├── contracts/             # Zod schemas for API contracts (shared from root)
│   ├── data/                  # Static data and catalogues
│   │   ├── catalogue.ts       # Exported static catalogues
│   │   ├── contact.ts         # Contact information
│   │   ├── fleets.ts          # Fleet vehicle data
│   │   ├── places.ts          # Location data
│   │   ├── prices.ts          # Pricing data
│   │   ├── seoLandingSlugs.ts # SEO landing page slugs
│   │   └── generated-*.json   # Generated catalog data
│   ├── features/              # Feature-based component organization
│   │   └── booking/           # Booking flow components
│   │       ├── BookingPage.tsx
│   │       ├── clean/         # Clean booking implementation
│   │       └── razorpay.ts    # Razorpay integration
│   ├── hooks/                 # Custom React hooks
│   │   └── useLocationIQ.ts   # Location search hook
│   ├── layouts/               # Layout components
│   │   └── SiteLayout.tsx     # Main site layout
│   ├── pages/                 # Page components (one per route)
│   │   ├── HomePage.tsx
│   │   ├── BookingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── PackagesPage.tsx
│   │   ├── RoutesPage.tsx
│   │   └── ... (25+ pages)
│   ├── services/              # API services and data fetching
│   │   ├── api.ts             # Customer API service
│   │   ├── catalog.ts         # Catalog service
│   │   ├── catalogManifest.ts # Catalog manifest generation
│   │   ├── cleanFareApi.ts    # Clean fare API service
│   │   ├── customerAuthApi.ts # Customer auth API
│   │   └── analytics.ts       # Analytics tracking
│   ├── styles.css             # Global styles and Tailwind imports
│   └── main.tsx               # React entry point
├── public/                    # Static assets
│   ├── _headers               # Cloudflare headers
│   ├── _redirects             # Cloudflare redirects
│   ├── robots.txt             # robots.txt
│   ├── sitemap.xml            # Generated sitemap
│   ├── icon-192.png           | PWA icon
│   └── images/                # Hero images and assets
├── scripts/                   # Build and validation scripts
│   ├── generate-sitemap.ts    # Sitemap generation
│   ├── prerender.ts           # Static page pre-rendering
│   ├── validate-seo-artifacts.ts
│   └── validate-pagespeed-guardrails.ts
├── index.html                 # HTML template
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

---

## 4. Application Architecture

### 4.1 Entry Points

#### [`main.tsx`](react/src/main.tsx) - Client Entry Point

```typescript
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

const appTree = (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

const doHydrate = () => {
  const root = createRoot(root);
  root.render(appTree);
};

// Hydration strategy for SSG - Zero-Spinner approach
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", doHydrate);
} else {
  doHydrate();
}
```

**Key Patterns:**
- Error boundary wrapping entire app
- Conditional hydration based on DOM ready state
- Single root element requirement
- **Zero-Spinner Hydration**: No loading spinner during hydration; static HTML is immediately interactive

#### [`ServerApp.tsx`](react/src/app/ServerApp.tsx) - Server Entry Point

The server app is a complete React component tree that can be rendered on the server. It imports all page components and routes them based on the pathname.

**Key Features:**
- All 25+ page components imported statically
- Generated catalog data merged with static data
- SEO metadata generation per route
- Catalogue invariants checked in development

### 4.2 Routing Strategy

#### [`routes.tsx`](react/src/app/routes.tsx) - Route Definitions

```typescript
export interface AppRoute {
  path: string;
  page: string;
  marketingHub?: boolean;
  seo?: {
    title: string;
    description: string;
    keywords?: string[];
  };
}

export const marketingHubs = [
  { path: "/services", page: "marketing", marketingHub: true },
  { path: "/routes", page: "marketing", marketingHub: true },
  { path: "/packages", page: "marketing", marketingHub: true },
  { path: "/monuments", page: "marketing", marketingHub: true },
  { path: "/fleet", page: "marketing", marketingHub: true },
  { path: "/about", page: "marketing", marketingHub: true },
  { path: "/contact", page: "marketing", marketingHub: true },
  { path: "/faq", page: "marketing", marketingHub: true },
  { path: "/privacy", page: "marketing", marketingHub: true },
  { path: "/terms", page: "marketing", marketingHub: true },
] as const;

export const appRoutes = [
  { path: "/", page: "home" },
  { path: "/booking", page: "booking" },
  ...marketingHubs,
] as const;
```

**Route Categories:**
1. **Marketing Hubs** - SEO-optimized landing pages for services, routes, packages, monuments, fleet, about, contact, FAQ, privacy, terms
2. **App Routes** - Core application pages (home, booking)
3. **Dynamic Routes** - Product detail pages (packages, routes, monuments, vehicles)

### 4.3 Main App Component

#### [`App.tsx`](react/src/app/App.tsx) - Main React Component

```typescript
export function App({ pathname: propPathname }: AppProps = {}) {
  const pathname = propPathname ?? (typeof window === "undefined" ? "/" : window.location.pathname);
  
  // SEO metadata generation
  const seo = useMemo(() => getSeo(pathname), [pathname]);
  
  // Catalogue resolution
  const matchedRoute = useMemo<Route | null>(() => {
    // Route matching logic
  }, [pathname]);
  
  const matchedPackage = useMemo<TourPackage | null>(() => {
    // Package matching logic
  }, [pathname]);
  
  const matchedMonument = useMemo<Monument | null>(() => {
    // Monument matching logic
  }, [pathname]);
  
  return (
    <ErrorBoundary>
      <CustomerAuthProvider>
        <SeoHead {...seo} />
        <SiteLayout currentPath={pathname}>
          <Suspense fallback={null}>
            {/* Page routing based on matched content */}
          </Suspense>
        </SiteLayout>
      </CustomerAuthProvider>
    </ErrorBoundary>
  );
}
```

**Key Features:**
- SEO metadata generation per route
- Catalogue resolution (routes, packages, monuments)
- Customer authentication provider
- SEO head component for dynamic metadata
- Lazy loading with Suspense

---

## 5. Component Architecture

### 5.1 Component Organization

Components are organized by **feature** rather than type, following this structure:

```
components/
├── seo/              # SEO-related components
│   └── SeoHead.tsx
├── badges.tsx        # Status badges
├── cards.tsx         # Card components
├── Chrome.tsx        # Layout chrome
├── ErrorBoundary.tsx # Error boundary
├── OAuthErrorBanner.tsx # OAuth error display
├── reveal.tsx        # Reveal animation
├── RichLandingPage.tsx # Rich landing page template
└── avatar/           # Buddy avatar widget
```

### 5.2 SEO Component

#### [`SeoHead.tsx`](react/src/components/seo/SeoHead.tsx) - Dynamic SEO Manager

```typescript
export interface SeoHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  noindex?: boolean;
  hreflangAlternates?: HreflangAlternate[];
  openGraph?: OpenGraphData;
  twitter?: TwitterCardData;
  schema?: Record<string, unknown>;
}

export function SeoHead({
  title,
  description,
  keywords,
  canonical,
  noindex,
  hreflangAlternates,
  openGraph,
  twitter,
  schema,
}: SeoHeadProps) {
  // Dynamic meta tag management
  // Canonical URL generation
  // Hreflang alternates (en-IN, hi-IN, x-default)
  // Open Graph protocol tags
  // Twitter card tags
  // Schema.org JSON-LD
}
```

**SEO Features:**
- Dynamic meta tag management
- Canonical URL based on single source domain
- Bilingual Hreflang Alternates (en-IN, hi-IN, x-default)
- Open Graph protocol tags
- Twitter / X card tags
- Local Agra Geo tags
- Schema.org JSON-LD LocalBusiness & WebSite graph

### 5.3 Layout Components

#### [`SiteLayout.tsx`](react/src/layouts/SiteLayout.tsx) - Main Layout

```typescript
export function SiteLayout({ children, currentPath }: SiteLayoutProps) {
  return (
    <div className="app-shell">
      <SkipLink />
      <OAuthErrorBanner />
      <Header currentPath={currentPath} />
      <div className="pt-16">
        {children}
      </div>
      <LeadBar />
      <RadialDock />
      <BuddyWidget />
      <Footer />
    </div>
  );
}
```

**Layout Structure:**
- Skip link for accessibility
- OAuth error banner
- Header with navigation
- Main content area
- Lead bar for lead capture
- Radial dock for quick actions
- Buddy avatar widget
- Footer with links

---

## 6. Service Layer

### 6.1 API Service

#### [`api.ts`](react/src/services/api.ts) - Customer API Service

```typescript
export function getApiBaseUrl(): string {
  // Returns backend API URL from environment
}

export type BookingSelectionPayload = {
  category: CategoryCode;
  productCode: string;
  vehicleTier?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  returnTime?: string;
  passengers: number;
  luggage: number;
};

export interface ServerFareBreakdown {
  baseFare: number;
  distanceCharges: number;
  nightAllowance: number;
  tollCharges: number;
  parkingCharges: number;
  driverAllowance: number;
  promoDiscount: number;
  totalFare: number;
  advanceAmount: number;
}

export async function createInquiry(payload: CreateInquiryPayload): Promise<void> {
  // Creates customer inquiry
}
```

**API Endpoints:**
- `POST /api/public/inquiries` - Create inquiry
- `GET /api/public/catalog` - Fetch published catalog
- `GET /api/public/reviews` - Fetch public reviews
- `GET /api/public/gallery` - Fetch public gallery

### 6.2 Clean Fare API

#### [`cleanFareApi.ts`](react/src/services/cleanFareApi.ts) - Fare System Service

```typescript
export async function fetchQuoteOptions(
  input: OptionsRequest,
  signal?: AbortSignal
): Promise<OptionsResponse> {
  // Fetches available options for a quote request
}

export async function createBooking(
  input: CreateBookingRequest,
  signal?: AbortSignal
): Promise<CreateBookingResponse> {
  // Creates a booking draft
}

export async function createBookingPayment(
  bookingId: string,
  input: CreatePaymentRequest,
  signal?: AbortSignal
): Promise<CreatePaymentResponse> {
  // Creates payment checkout session
}

export async function verifyBookingPayment(
  bookingId: string,
  paymentId: string,
  signal?: AbortSignal
): Promise<VerifyPaymentResponse> {
  // Verifies payment completion
}
```

**Fare System Features:**
- Quote options fetching
- Booking creation with server-authoritative fares
- Payment checkout session creation
- Payment verification
- Idempotency keys for all operations

### 6.3 Catalog Service

#### [`catalog.ts`](react/src/services/catalog.ts) - Live Catalog Service

```typescript
export async function fetchPublishedCatalog(
  signal?: AbortSignal
): Promise<PublishedCatalogResponse> {
  // Fetches published catalog from backend
}

export async function fetchPublishedTourPackages(
  signal?: AbortSignal
): Promise<TourPackage[]> {
  // Fetches published tour packages
}

export async function fetchPublishedRoutes(
  signal?: AbortSignal
): Promise<Route[]> {
  // Fetches published routes
}

export async function fetchPublishedMonuments(
  signal?: AbortSignal
): Promise<Monument[]> {
  // Fetches published monuments
}
```

**Catalog Features:**
- Live catalog fetching from backend
- 1-minute cache with TTL
- Automatic URL resolution for media
- Type-safe response parsing with Zod

---

## 7. State Management

### 7.1 Authentication Context

#### [`customerAuth.tsx`](react/src/auth/customerAuth.tsx) - Customer Auth Provider

```typescript
export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Supabase client initialization
  const client = useMemo(() => getCustomerSupabaseClient(), []);
  
  // Auth state change listener
  useEffect(() => {
    const setupAuth = async () => {
      const { data: { subscription } } = client.auth.onAuthStateChange(
        (_event, nextSession) => {
          setSession(nextSession);
          setUser(nextSession?.user ?? null);
          setLoading(false);
        }
      );
      return () => subscription.unsubscribe();
    };
    setupAuth();
  }, [client]);
  
  // Sign in with Google
  const signInWithGoogle = useCallback(async (returnTo: string) => {
    await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getOAuthRedirectUrl("google", returnTo) },
    });
  }, [client]);
  
  // Sign in with password
  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, [client]);
  
  // Sign out
  const signOut = useCallback(async () => {
    await client.auth.signOut();
  }, [client]);
  
  return (
    <CustomerAuthContext.Provider value={{ session, user, loading, signInWithGoogle, signInWithPassword, signOut }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}
```

**Auth Features:**
- Supabase client initialization
- Auth state management
- Google OAuth sign-in
- Password sign-in
- Sign out
- OAuth error handling
- Stale state cleanup

### 7.2 Booking State

The booking flow uses a **server-authoritative state machine** with the following states:

```
draft → pending_payment → paid_confirmed → in_transit → completed
                                          ↓
                                  cancelled ← refunded
```

**State Transitions:**
1. **draft** - Booking created, awaiting payment
2. **pending_payment** - Payment initiated, awaiting confirmation
3. **paid_confirmed** - Payment verified, booking confirmed
4. **in_transit** - Trip in progress
5. **completed** - Trip completed (with `balanceCollectedByDriver = true` updated by `super_admin`)
6. **cancelled** - Booking cancelled
7. **refunded** - Booking refunded

---

## 8. Static Site Generation (SSG)

### 8.1 Build Process

The frontend uses a **hybrid SSG approach** with the following build steps:

```bash
# 1. Validate site configuration
npm run validate-site-config

# 2. TypeScript compilation
npm run tsc

# 3. Generate catalog manifests
npm run build-manifest

# 4. Vite production build
npm run vite build

# 5. Pre-render all marketing pages
npm run prerender

# 6. Validate SEO artifacts
npm run validate-seo-artifacts

# 7. Validate PageSpeed guardrails
npm run validate-pagespeed-guardrails

# 8. Generate release metadata
npm run generate-release
```

### 8.2 Pre-rendering

#### [`prerender.ts`](react/scripts/prerender.ts) - Static Page Generation

```typescript
async function prerender() {
  // Load generated catalog data
  const publishedCatalog = await loadPublishedCatalog();
  const publishedRoutes = await loadPublishedRoutes();
  const publishedPackages = await loadPublishedPackages();
  const publishedMonuments = await loadPublishedMonuments();
  
  // Render each page to static HTML
  for (const route of appRoutes) {
    const html = await renderToString(<App pathname={route.path} />);
    await fs.writeFile(`dist${route.path}/index.html`, html);
  }
  
  // Generate sitemap
  await generateSitemap();
}
```

**Pre-rendered Pages:**
- Home page (`/`)
- Marketing hubs (services, routes, packages, monuments, fleet, about, contact, FAQ, privacy, terms)
- Product detail pages (packages, routes, monuments, vehicles)
- Booking flow pages

### 8.3 Catalog Generation

Catalog data is generated from the backend database and committed to the repository:

```json
// generated-published-catalog.json
{
  "packages": [
    {
      "id": "uuid",
      "code": "TTP001",
      "name": "Taj Mahal Sightseeing",
      "slug": "taj-mahal-sightseeing",
      "description": "Full-day sightseeing tour...",
      "durationText": "8 hours",
      "startingPriceInr": 2500,
      "coverImage": { "url": "/images/taj-mahal.jpg" },
      "gallery": [...]
    }
  ],
  "routes": [...],
  "vehicles": [...],
  "monuments": [...]
}
```

**Generation Process:**
1. Backend exports catalog data to JSON
2. Frontend build process imports and validates data
3. Static data merged with live catalog at runtime
4. Catalogue invariants checked in development

---

## 9. SEO Implementation

### 9.1 SEO Metadata

#### [`SeoHead.tsx`](react/src/components/seo/SeoHead.tsx) - SEO Metadata Manager

```typescript
export function SeoHead({
  title,
  description,
  keywords,
  canonical,
  noindex,
  hreflangAlternates,
  openGraph,
  twitter,
  schema,
}: SeoHeadProps) {
  // Document title
  useEffect(() => {
    document.title = title;
  }, [title]);
  
  // Meta description
  useEffect(() => {
    setMeta("name", "description", description);
  }, [description]);
  
  // Robots index/follow
  useEffect(() => {
    if (noindex) {
      setMeta("name", "robots", "noindex, nofollow");
    } else {
      setMeta("name", "robots", "index, follow");
    }
  }, [noindex]);
  
  // Canonical URL
  useEffect(() => {
    if (canonical) {
      const link = document.querySelector("link[rel='canonical']");
      if (link) {
        link.setAttribute("href", canonical);
      } else {
        const link = document.createElement("link");
        link.rel = "canonical";
        link.href = canonical;
        document.head.appendChild(link);
      }
    }
  }, [canonical]);
  
  // Hreflang alternates
  useEffect(() => {
    hreflangAlternates?.forEach(({ href, hreflang }) => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = hreflang;
      link.href = href;
      document.head.appendChild(link);
    });
  }, [hreflangAlternates]);
  
  // Open Graph tags
  useEffect(() => {
    if (openGraph) {
      setMeta("property", "og:title", openGraph.title);
      setMeta("property", "og:description", openGraph.description);
      setMeta("property", "og:image", openGraph.image);
      setMeta("property", "og:url", openGraph.url);
      setMeta("property", "og:type", openGraph.type ?? "website");
    }
  }, [openGraph]);
  
  // Twitter card tags
  useEffect(() => {
    if (twitter) {
      setMeta("name", "twitter:card", twitter.card);
      setMeta("name", "twitter:title", twitter.title);
      setMeta("name", "twitter:description", twitter.description);
      setMeta("name", "twitter:image", twitter.image);
    }
  }, [twitter]);
  
  // Schema.org JSON-LD
  useEffect(() => {
    if (schema) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }, [schema]);
}
```

### 9.2 SEO Best Practices

**Implemented:**
- Unique title per page
- Meta description (150-160 characters)
- Canonical URL based on single source domain
- Hreflang alternates for bilingual support
- Open Graph protocol tags
- Twitter card tags
- Schema.org JSON-LD for LocalBusiness and WebSite
- Local Agra Geo tags
- Bilingual content (English and Hindi)

**SEO Guardrails:**
- PageSpeed Insights scores > 90
- Core Web Vitals thresholds
- Sitemap.xml generation
- robots.txt configuration
- Noindex/nofollow directives for non-public pages

---

## 10. Performance Optimization

### 10.1 Code Splitting with Vite Bundle Splitting

```typescript
// vite.config.ts - Manual chunk splitting for vendor libraries
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React and ReactDOM into separate vendor chunks
          "vendor-react": ["react", "react-dom", "react-dom/client"],
          // Split Framer Motion separately
          "vendor-motion": ["motion"],
          // Split Supabase separately
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
  },
});
```

**Benefits:**
- Independent caching of vendor libraries
- Reduced initial bundle size
- Faster page loads with parallel downloads

### 10.2 On-Demand Razorpay Script Loading

```typescript
// Lazy load Razorpay SDK only when payment is initiated
let razorpayLoaded: Promise<void> | null = null;

export async function loadRazorpayScript(): Promise<void> {
  if (razorpayLoaded) return razorpayLoaded;
  
  razorpayLoaded = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.head.appendChild(script);
  });
  
  return razorpayLoaded;
}
```

**Benefits:**
- Razorpay SDK not loaded on initial page load
- Reduced initial bundle size
- Faster page loads for non-payment pages

### 10.3 Image Optimization

```typescript
// WebP format with fallback
<img src="/images/hero-taj-sunrise-960.webp" alt="Taj Mahal sunrise" />
<img src="/images/hero-taj-sunrise-960.avif" alt="Taj Mahal sunrise" />

// Responsive images
<picture>
  <source srcSet="/images/hero-taj-sunrise-480.webp 480w,
                   /images/hero-taj-sunrise-960.webp 960w,
                   /images/hero-taj-sunrise-1600.webp 1600w"
          sizes="(max-width: 480px) 100vw, (max-width: 960px) 50vw, 33vw"
          type="image/webp" />
  <img src="/images/hero-taj-sunrise-960.webp"
       alt="Taj Mahal sunrise"
       loading="lazy" />
</picture>
```

### 10.4 Resource Prefetching

#### [`prefetch.ts`](react/src/app/prefetch.ts) - Prefetch Utility

```typescript
const prefetchedUrls = new Set<string>();

export function prefetchDocument(url: string): void {
  if (prefetchedUrls.has(url) || url.startsWith("#") || url.startsWith("tel:") || url.startsWith("https://wa.me")) {
    return;
  }
  
  prefetchedUrls.add(url);
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url;
  document.head.appendChild(link);
}
```

### 10.5 Hydration Hygiene

```typescript
// Hydration strategy for SSG - Zero-Spinner approach
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", doHydrate);
} else {
  doHydrate();
}
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
// Example: Fare calculation test
import { describe, it, expect } from "vitest";
import { calculateFare } from "../../../backend/src/modules/fares/fare.engine";

describe("Fare Engine", () => {
  it("calculates one-way fare correctly", () => {
    const result = calculateFare({
      category: "outstation",
      productCode: "agra-london",
      vehicleTier: "sedan",
      pickupDate: "2024-06-15",
      pickupTime: "10:00",
      passengers: 3,
      luggage: 2,
      distanceKm: 200,
    });
    
    expect(result.fare.totalFare).toBe(4500);
    expect(result.fare.advanceAmount).toBe(1260);
  });
});
```

### 11.2 Integration Tests

```typescript
// Example: API service test
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createInquiry } from "../../services/api";

describe("API Service", () => {
  it("creates inquiry successfully", async () => {
    const payload = {
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
      message: "I want to book a cab",
    };
    
    await createInquiry(payload);
    
    // Verify inquiry was created
  });
});
```

### 11.3 E2E Tests

```typescript
// Example: Booking flow test
import { describe, it, expect } from "vitest";
import { test } from "@testsprite/testsprite";

describe("Booking Flow", () => {
  it("completes booking from home to payment", async ({ page }) => {
    // Navigate to home
    await page.goto("/");
    
    // Select package
    await page.click(".package-card:nth-child(1)");
    
    // Select date and time
    await page.click(".date-picker");
    await page.click(".date-cell[data-date='2024-06-15']");
    await page.selectOption(".time-picker", "10:00");
    
    // Select vehicle
    await page.click(".vehicle-card:nth-child(1)");
    
    // Fill customer details
    await page.fill("#name", "John Doe");
    await page.fill("#email", "john@example.com");
    await page.fill("#phone", "9876543210");
    
    // Proceed to payment
    await page.click("#proceed-to-payment");
    
    // Verify payment page
    expect(page.url()).toContain("/payment");
  });
});
```

---

## 12. Deployment

### 12.1 Build Configuration

#### [`vite.config.ts`](react/vite.config.ts) - Vite Configuration

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

### 12.2 Environment Variables

```bash
# Backend API
VITE_API_URL=https://api.example.com

# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Razorpay
VITE_RAZORPAY_KEY=rzp_test_xxxxx

# Analytics
VITE_GA_ID=G-XXXXXXXXXX
VITE_GTAG_ID=GTM-XXXXXXXX

# Feature Flags
VITE_ENABLE_NEW_FEATURE=false
```

### 12.3 Cloudflare Pages

#### [`cloudflare-pages.toml`](react/cloudflare-pages.toml) - Cloudflare Configuration

```toml
[build]
command = "npm run build:all"
publish = "dist"

[build.environment]
NODE_VERSION = "22"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200

[[headers]]
for = "/*"
[headers.values]
X-Frame-Options = "DENY"
X-Content-Type-Options = "nosniff"
X-XSS-Protection = "1; mode=block"
Referrer-Policy = "strict-origin-when-cross-origin"
Strict-Transport-Security = "max-age=31536000; includeSubDomains"
Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.razorpay.com https://*.googleapis.com; frame-ancestors 'none';"

[[headers]]
for = "/_headers"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
for = "/sitemap.xml"
[headers.values]
Cache-Control = "public, max-age=3600"
```

---

## 13. Security

### 13.1 Authentication

**Implemented:**
- Supabase authentication (Google OAuth, password)
- JWT token management
- Session refresh
- OAuth state validation
- Stale state cleanup

### 13.2 Authorization

**Implemented:**
- Role-based access control (RBAC)
- Admin role verification
- Customer authentication provider

### 13.3 Data Protection

**Implemented:**
- Server-authoritative fares (client never determines prices)
- Payment verification via webhook
- Idempotency keys for all operations
- Input validation with Zod

---

## 14. Development Workflow

### 14.1 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Type check
npm run typecheck

# Build
npm run build
```

### 14.2 Code Quality

**Implemented:**
- TypeScript strict mode
- ESLint with React plugin
- Prettier for code formatting
- Vitest for unit and integration tests
- TestSprite for E2E tests

---

## 15. SEO and Performance Standards

### 15.1 Core Web Vitals

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP | < 2.0s | PageSpeed Insights |
| INP | < 100ms | PageSpeed Insights |
| CLS | < 0.05 | PageSpeed Insights |
| PageSpeed | 95+ | PageSpeed Insights |

### 15.2 SEO Checklist

- [ ] Unique title per page
- [ ] Meta description (150-160 characters)
- [ ] Canonical URL
- [ ] Hreflang alternates
- [ ] Open Graph tags
- [ ] Twitter card tags
- [ ] Schema.org JSON-LD
- [ ] Sitemap.xml
- [ ] robots.txt
- [ ] Noindex/nofollow for non-public pages

### 15.3 Performance Checklist

- [ ] Code splitting with lazy loading
- [ ] Image optimization (WebP, AVIF)
- [ ] Resource prefetching
- [ ] Hydration hygiene
- [ ] Bundle size monitoring
- [ ] PageSpeed Insights > 95

---

## 16. Deployment Checklist

### 16.1 Pre-Deployment

- [ ] Run `npm run verify` (typecheck + tests + build)
- [ ] Validate SEO artifacts
- [ ] Validate PageSpeed guardrails
- [ ] Test all routes
- [ ] Test authentication flow
- [ ] Test booking flow
- [ ] Test payment flow

### 16.2 Deployment

```bash
# Build
npm run build:all

# Deploy to Cloudflare Pages
wrangler pages deploy dist
```

### 16.3 Post-Deployment

- [ ] Verify sitemap.xml
- [ ] Verify robots.txt
- [ ] Test all routes
- [ ] Test authentication flow
- [ ] Test booking flow
- [ ] Test payment flow
- [ ] Check PageSpeed Insights
- [ ] Check SEO metrics

---

## 17. References

### 17.1 Documentation

- [`FRONTEND_RULES.md`](FRONTEND_RULES.md) - Master frontend architectural standard
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) - Deployment documentation
- [`docs/CUSTOMER_SITE_PRD.md`](docs/CUSTOMER_SITE_PRD.md) - Customer site PRD
- [`react/README.md`](react/README.md) - React app README

### 17.2 Official Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Zod Documentation](https://zod.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [PageSpeed Insights](https://pagespeed.web.dev)
- [Google Search Console](https://search.google.com/search-console)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Screaming Frog SEO Spider](https://www.screamingfrog.co.uk/seo-spider)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

### 17.3 Related Documents

- [`docs/PROJECT_ARCHITECTURE.md`](docs/PROJECT_ARCHITECTURE.md) - Project architecture
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) - Database schema
- [`docs/BACKEND_ARCHITECTURE.md`](docs/BACKEND_ARCHITECTURE.md) - Backend architecture
- [`docs/PAYMENT_SYSTEM.md`](docs/PAYMENT_SYSTEM.md) - Payment system
