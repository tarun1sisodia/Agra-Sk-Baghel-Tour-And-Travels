    # SEO Engine Documentation — Agra SK Baghel Tour & Travels

## 1. Overview

This document defines the SEO engine for Agra SK Baghel Tour & Travels platform.

**SEO Vision:**
- Automated SEO validation across all public pages
- Centralized SEO management
- Database-driven SEO configuration
- Real-time SEO monitoring

**Key Components:**
- Metadata Manager
- URL Manager
- Schema Generator
- Localization Engine
- Sitemap Engine
- SEO Validation Engine
- SEO Dashboard

---

## 2. SEO Engine Architecture

### 2.1 SEO Engine Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SEO Engine Architecture                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │  Metadata       │  │  URL Manager    │  │  Schema         │      │
│  │  Manager        │  │                 │  │  Generator      │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│         │                      │                      │              │
│         └──────────────────────┴──────────────────────┘              │
│                                │                                      │
│                        ┌───────▼───────┐                             │
│                        │  SEO Engine   │                             │
│                        └───────┬───────┘                             │
│                                │                                      │
│         ┌──────────────────────┴──────────────────────┐              │
│         │                      │                      │              │
│  ┌──────▼───────┐  ┌──────────▼──────────┐  ┌────────▼─────────┐    │
│  │ Localization │  │  Sitemap Engine     │  │  SEO Validation  │    │
│  │ Engine       │  │                     │  │  Engine          │    │
│  └──────────────┘  └─────────────────────┘  └──────────────────┘    │
│                                                                       │
│                              ┌────────┐                               │
│                              │ SEO    │                               │
│                              │ Dashboard │                             │
│                              └────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 SEO Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SEO Data Flow                                │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Admin creates/updates content                                    │
│    ↓                                                                 │
│ 2. SEO metadata entered (title, description, canonical, etc.)       │
│    ↓                                                                 │
│ 3. SEO engine validates metadata                                    │
│    ↓                                                                 │
│ 4. SEO data stored in database                                      │
│    ↓                                                                 │
│ 5. Content published                                                │
│    ↓                                                                 │
│ 6. SEO data rendered in HTML                                        │
│    ↓                                                                 │
│ 7. Sitemap updated                                                  │
│    ↓                                                                 │
│ 8. SEO dashboard updated                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Metadata Manager

### 3.1 Metadata Fields

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| title | string | Yes | 60 | Page title for SERP |
| description | string | Yes | 160 | Meta description for SERP |
| canonical | string | Yes | 2048 | Canonical URL |
| keywords | string | No | 255 | SEO keywords |
| og:title | string | Yes | 100 | Open Graph title |
| og:description | string | Yes | 200 | Open Graph description |
| og:image | string | Yes | 2048 | Open Graph image |
| twitter:title | string | Yes | 70 | Twitter card title |
| twitter:description | string | Yes | 200 | Twitter card description |
| twitter:image | string | Yes | 2048 | Twitter card image |

### 3.2 Metadata Schema

```typescript
export interface SEOMetadata {
  id: string;
  url: string;
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noindex?: boolean;
  nofollow?: boolean;
  hreflang?: HreflangAlternate[];
  schema?: SchemaData;
  createdAt: string;
  updatedAt: string;
}

export interface HreflangAlternate {
  hreflang: string;
  href: string;
}

export interface SchemaData {
  type: string;
  data: Record<string, unknown>;
}
```

### 3.3 Metadata Manager API

```typescript
export interface SEOMetadataManager {
  getMetadata(url: string): Promise<SEOMetadata | null>;
  saveMetadata(metadata: SEOMetadata): Promise<void>;
  deleteMetadata(url: string): Promise<void>;
  validateMetadata(metadata: SEOMetadata): ValidationResult;
}

export class SEOMetadataManagerImpl implements SEOMetadataManager {
  async getMetadata(url: string): Promise<SEOMetadata | null> {
    // Query database for metadata
  }
  
  async saveMetadata(metadata: SEOMetadata): Promise<void> {
    // Save metadata to database
  }
  
  async deleteMetadata(url: string): Promise<void> {
    // Delete metadata from database
  }
  
  async validateMetadata(metadata: SEOMetadata): Promise<ValidationResult> {
    // Validate metadata
  }
}
```

---

## 4. URL Manager

### 4.1 URL Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| slug | string | Yes | URL slug |
| canonical | string | Yes | Canonical URL |
| redirect | string | No | Redirect URL |
| redirectType | number | No | HTTP redirect type (301, 302) |

### 4.2 URL Schema

```typescript
export interface SEOURL {
  id: string;
  url: string;
  slug: string;
  canonical: string;
  redirect?: string;
  redirectType?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 4.3 URL Manager API

```typescript
export interface SEOURLManager {
  getURL(url: string): Promise<SEOURL | null>;
  saveURL(url: SEOURL): Promise<void>;
  deleteURL(url: string): Promise<void>;
  validateSlug(slug: string): ValidationResult;
  generateSlug(title: string): string;
}

export class SEOURLManagerImpl implements SEOURLManager {
  async getURL(url: string): Promise<SEOURL | null> {
    // Query database for URL
  }
  
  async saveURL(url: SEOURL): Promise<void> {
    // Save URL to database
  }
  
  async deleteURL(url: string): Promise<void> {
    // Delete URL from database
  }
  
  async validateSlug(slug: string): Promise<ValidationResult> {
    // Validate slug uniqueness
  }
  
  generateSlug(title: string): string {
    // Generate slug from title
  }
}
```

---

## 5. Schema Generator

### 5.1 Schema Types

| Type | Description | Required Fields |
|------|-------------|-----------------|
| WebSite | Website schema | name, url,potentialAction |
| LocalBusiness | Local business schema | name, address, telephone |
| TourPackage | Tour package schema | name, description, offers |
| Product | Product schema | name, description, offers |
| Review | Review schema | itemReviewed, reviewRating |
| BreadcrumbList | Breadcrumb schema | itemListElement |

### 5.2 Schema Schema

```typescript
export interface SchemaData {
  type: string;
  data: Record<string, unknown>;
}

export interface SEOSchema {
  id: string;
  url: string;
  type: string;
  data: SchemaData;
  isValid: boolean;
  errors?: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 5.3 Schema Generator API

```typescript
export interface SEOSchemaGenerator {
  generateSchema(url: string, contentType: string, content: any): SchemaData;
  validateSchema(schema: SchemaData): ValidationResult;
}

export class SEOSchemaGeneratorImpl implements SEOSchemaGenerator {
  async generateSchema(url: string, contentType: string, content: any): Promise<SchemaData> {
    // Generate schema based on content type
  }
  
  async validateSchema(schema: SchemaData): Promise<ValidationResult> {
    // Validate schema
  }
}
```

---

## 6. Localization Engine

### 6.1 Language Support

| Language | Code | Description |
|----------|------|-------------|
| English | en-IN | English (India) |
| Hindi | hi-IN | Hindi (India) |
| Default | x-default | Default language |

### 6.2 Hreflang Schema

```typescript
export interface HreflangAlternate {
  hreflang: string;
  href: string;
}

export interface SEOHreflang {
  id: string;
  url: string;
  alternates: HreflangAlternate[];
  createdAt: string;
  updatedAt: string;
}
```

### 6.3 Localization Engine API

```typescript
export interface SEOLocalizationEngine {
  getAlternates(url: string): Promise<HreflangAlternate[]>;
  saveAlternates(url: string, alternates: HreflangAlternate[]): Promise<void>;
  validateAlternates(alternates: HreflangAlternate[]): ValidationResult;
}

export class SEOLocalizationEngineImpl implements SEOLocalizationEngine {
  async getAlternates(url: string): Promise<HreflangAlternate[]> {
    // Query database for alternates
  }
  
  async saveAlternates(url: string, alternates: HreflangAlternate[]): Promise<void> {
    // Save alternates to database
  }
  
  async validateAlternates(alternates: HreflangAlternate[]): Promise<ValidationResult> {
    // Validate alternates
  }
}
```

---

## 7. Sitemap Engine

### 7.1 Sitemap Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://agraskbagheltourandtravels.com/</loc>
    <lastmod>2024-01-01T00:00:00Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://agraskbagheltourandtravels.com/packages/golden-triangle</loc>
    <lastmod>2024-01-01T00:00:00Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### 7.2 Sitemap Schema

```typescript
export interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface Sitemap {
  id: string;
  entries: SitemapEntry[];
  isValid: boolean;
  errors?: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 7.3 Sitemap Engine API

```typescript
export interface SitemapEngine {
  generateSitemap(): Promise<Sitemap>;
  getSitemap(): Promise<Sitemap>;
  updateSitemap(): Promise<void>;
  validateSitemap(sitemap: Sitemap): ValidationResult;
}

export class SitemapEngineImpl implements SitemapEngine {
  async generateSitemap(): Promise<Sitemap> {
    // Generate sitemap from database
  }
  
  async getSitemap(): Promise<Sitemap> {
    // Get sitemap from database
  }
  
  async updateSitemap(): Promise<void> {
    // Update sitemap in database
  }
  
  async validateSitemap(sitemap: Sitemap): Promise<ValidationResult> {
    // Validate sitemap
  }
}
```

---

## 8. SEO Validation Engine

### 8.1 Validation Rules

**Title Validation:**
- Required: Yes
- Length: 50-60 characters
- Unique: Yes (per page)

**Description Validation:**
- Required: Yes
- Length: 150-160 characters
- Unique: Yes (per page)

**Canonical Validation:**
- Required: Yes
- Format: Valid URL
- Unique: Yes (per page)

**Slug Validation:**
- Required: Yes
- Format: Valid slug
- Unique: Yes (per page)

**Image Validation:**
- Required: Yes (for most pages)
- Format: Valid URL
- Size: Minimum 1200x630px

**Schema Validation:**
- Required: Yes (for most pages)
- Format: Valid JSON-LD
- Type: Valid schema type

### 8.2 Validation Schema

```typescript
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
}
```

### 8.3 Validation Engine API

```typescript
export interface SEOValidationEngine {
  validatePage(url: string): Promise<ValidationResult>;
  validateMetadata(metadata: SEOMetadata): ValidationResult;
  validateSchema(schema: SchemaData): ValidationResult;
  validateSitemap(sitemap: Sitemap): ValidationResult;
}

export class SEOValidationEngineImpl implements SEOValidationEngine {
  async validatePage(url: string): Promise<ValidationResult> {
    // Validate all SEO aspects for page
  }
  
  async validateMetadata(metadata: SEOMetadata): Promise<ValidationResult> {
    // Validate metadata
  }
  
  async validateSchema(schema: SchemaData): Promise<ValidationResult> {
    // Validate schema
  }
  
  async validateSitemap(sitemap: Sitemap): Promise<ValidationResult> {
    // Validate sitemap
  }
}
```

---

## 9. SEO Dashboard

### 9.1 Dashboard Metrics

| Metric | Description |
|--------|-------------|
| Total Pages | Total number of public pages |
| Indexable Pages | Number of indexable pages |
| Pages with Issues | Number of pages with SEO issues |
| Missing Title | Number of pages missing title |
| Missing Description | Number of pages missing description |
| Broken Links | Number of broken internal links |
| Missing Images | Number of pages missing images |
| Schema Issues | Number of pages with schema issues |

### 9.2 Dashboard Schema

```typescript
export interface SEODashboard {
  totalPages: number;
  indexablePages: number;
  pagesWithIssues: number;
  missingTitle: number;
  missingDescription: number;
  brokenLinks: number;
  missingImages: number;
  schemaIssues: number;
  lastUpdated: string;
}
```

### 9.3 Dashboard API

```typescript
export interface SEODashboardAPI {
  getDashboard(): Promise<SEODashboard>;
  getPageIssues(url: string): Promise<ValidationResult[]>;
  getTopIssues(): Promise<ValidationResult[]>;
}

export class SEODashboardAPIImpl implements SEODashboardAPI {
  async getDashboard(): Promise<SEODashboard> {
    // Get dashboard metrics
  }
  
  async getPageIssues(url: string): Promise<ValidationResult[]> {
    // Get issues for page
  }
  
  async getTopIssues(): Promise<ValidationResult[]> {
    // Get top issues
  }
}
```

---

## 10. SEO Templates

### 10.1 Tour Package Template

**Title:** `{Package Name} - {Duration} Tour Package from {Source} | Agra SK Baghel Tour & Travels`

**Description:** `Book {Package Name} tour package. {Duration} days. {Inclusions}. Best rates guaranteed.`

**Canonical:** `https://agraskbagheltourandtravels.com/packages/{slug}`

**Open Graph:**
- og:title: `{Package Name} - {Duration} Tour Package`
- og:description: `{Inclusions}. Best rates guaranteed.`
- og:image: `{Package Image URL}`

**Schema:** `TourPackage`

**Breadcrumbs:** `Home > Packages > {Package Name}`

### 10.2 Route Template

**Title:** `{Source} to {Destination} Taxi - Book Online | Agra SK Baghel Tour & Travels`

**Description:** `Book affordable taxi from {Source} to {Destination}. {Distance} km. {Duration}. 24/7 support.`

**Canonical:** `https://agraskbagheltourandtravels.com/routes/{slug}`

**Open Graph:**
- og:title: `{Source} to {Destination} Taxi`
- og:description: `{Distance} km. {Duration}. Best rates.`
- og:image: `{Route Image URL}`

**Schema:** `Product`

**Breadcrumbs:** `Home > Routes > {Source} to {Destination}`

### 10.3 Destination Template

**Title:** `{Destination} Travel Guide - Things to Do | Agra SK Baghel Tour & Travels`

**Description:** `Plan your trip to {Destination}. Best places to visit, activities, and travel tips.`

**Canonical:** `https://agraskbagheltourandtravels.com/destinations/{slug}`

**Open Graph:**
- og:title: `{Destination} Travel Guide`
- og:description: `Best places to visit and activities.`
- og:image: `{Destination Image URL}`

**Schema:** `Place`

**Breadcrumbs:** `Home > Destinations > {Destination}`

---

## 11. SEO Publishing Rules

### 11.1 Indexability Rules

A page is indexable if:
- Status is 'published'
- Title is present and valid
- Description is present and valid
- Canonical URL is valid
- No 'noindex' directive
- Content meets minimum quality requirements

### 11.2 Publishing Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SEO Publishing Workflow                      │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Admin creates content                                            │
│    ↓                                                                 │
│ 2. SEO metadata entered                                             │
│    ↓                                                                 │
│ 3. SEO validation engine checks metadata                            │
│    ↓                                                                 │
│ 4. If valid: Content can be published                               │
│    ↓                                                                 │
│ 5. If invalid: Publishing blocked with error messages               │
│    ↓                                                                 │
│ 6. Content published                                                │
│    ↓                                                                 │
│ 7. SEO data rendered in HTML                                        │
│    ↓                                                                 │
│ 8. Sitemap updated                                                  │
│    ↓                                                                 │
│ 9. SEO dashboard updated                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 12. Conclusion

This SEO engine documentation provides a comprehensive framework for managing SEO in the Agra SK Baghel Tour & Travels platform.

**Key Takeaways:**
1. Centralized SEO management with database-driven configuration
2. Automated SEO validation across all public pages
3. Metadata, URL, schema, and localization management
4. Sitemap generation and validation
5. Real-time SEO monitoring with dashboard

**Next Steps:**
1. Implement metadata manager
2. Build URL manager
3. Create schema generator
4. Set up localization engine
5. Build sitemap engine
6. Implement SEO validation engine
7. Create SEO dashboard