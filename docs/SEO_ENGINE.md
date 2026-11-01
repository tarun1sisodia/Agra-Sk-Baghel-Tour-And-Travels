# SEO Engine Documentation — Agra SK Baghel Tour & Travels

## 1. Overview

This document defines the SEO engine for Agra SK Baghel Tour & Travels platform.

**SEO Vision:**
- Automated SEO validation across all public pages
- Centralized SEO management
- Database-driven SEO configuration
- Real-time SEO monitoring

**Key Components:**
- Database-Backed Metadata (`seo_metadata` table)
- Database-Backed Redirects (`seo_redirects` table)
- Deterministic Fallback Templates
- SEO Validation Engine
- SEO Dashboard

---

## 2. Database-Backed Metadata

### 2.1 Database Schema

```sql
CREATE TABLE seo_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_path VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(70) NOT NULL,
  description VARCHAR(170) NOT NULL,
  canonical_url VARCHAR(2048) NOT NULL,
  og_title VARCHAR(100),
  og_description VARCHAR(200),
  og_image_url VARCHAR(2048),
  noindex BOOLEAN DEFAULT FALSE,
  schema_json_ld JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seo_metadata_url_path ON seo_metadata(url_path);
```

### 2.2 Metadata Contract

```typescript
export const SeoMetadataItem = z.object({
  id: Uuid,
  url_path: z.string().min(1),
  title: z.string().min(10).max(70),
  description: z.string().min(50).max(170),
  canonical_url: z.string().url(),
  og_title: z.string().max(100).nullable().optional(),
  og_description: z.string().max(200).nullable().optional(),
  og_image_url: z.string().url().nullable().optional(),
  noindex: z.boolean().default(false),
  schema_json_ld: z.record(z.string(), z.unknown()).nullable().optional(),
  updated_at: z.string(),
});
export type SeoMetadataItem = z.infer<typeof SeoMetadataItem>;
```

### 2.3 Repository Implementation

```typescript
export interface SeoMetadataRepository {
  getByPath(urlPath: string): Promise<SeoMetadataItem | null>;
  upsert(record: Omit<SeoMetadataItem, 'id' | 'updated_at'>): Promise<SeoMetadataItem>;
  listActiveRedirects(): Promise<SeoRedirectItem[]>;
}

export class PostgresSeoMetadataRepository implements SeoMetadataRepository {
  async getByPath(urlPath: string): Promise<SeoMetadataItem | null> {
    const result = await this.client.query<SeoMetadataItem>(
      `SELECT * FROM seo_metadata WHERE url_path = $1`,
      [urlPath]
    );
    return result.rows[0] ?? null;
  }
  
  async upsert(record: Omit<SeoMetadataItem, 'id' | 'updated_at'>): Promise<SeoMetadataItem> {
    const result = await this.client.query<SeoMetadataItem>(
      `INSERT INTO seo_metadata (url_path, title, description, canonical_url, og_title, og_description, og_image_url, noindex, schema_json_ld)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (url_path) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         canonical_url = EXCLUDED.canonical_url,
         og_title = EXCLUDED.og_title,
         og_description = EXCLUDED.og_description,
         og_image_url = EXCLUDED.og_image_url,
         noindex = EXCLUDED.noindex,
         schema_json_ld = EXCLUDED.schema_json_ld,
         updated_at = NOW()
       RETURNING *`,
      [record.url_path, record.title, record.description, record.canonical_url, record.og_title, record.og_description, record.og_image_url, record.noindex, record.schema_json_ld]
    );
    return result.rows[0];
  }
}
```

---

## 3. Database-Backed Redirects

### 3.1 Database Schema

```sql
CREATE TABLE seo_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path VARCHAR(255) NOT NULL,
  to_path VARCHAR(255) NOT NULL,
  status_code SMALLINT NOT NULL DEFAULT 301,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seo_redirects_from_path ON seo_redirects(from_path);
CREATE INDEX idx_seo_redirects_is_active ON seo_redirects(is_active);
```

### 3.2 Redirect Contract

```typescript
export const SeoRedirectItem = z.object({
  id: Uuid,
  from_path: z.string().min(1),
  to_path: z.string().min(1),
  status_code: z.union([z.literal(301), z.literal(302)]).default(301),
  is_active: z.boolean().default(true),
  created_at: z.string(),
});
export type SeoRedirectItem = z.infer<typeof SeoRedirectItem>;
```

### 3.3 Repository Implementation

```typescript
export interface SeoRedirectRepository {
  listActiveRedirects(): Promise<SeoRedirectItem[]>;
  getByFromPath(fromPath: string): Promise<SeoRedirectItem | null>;
}

export class PostgresSeoRedirectRepository implements SeoRedirectRepository {
  async listActiveRedirects(): Promise<SeoRedirectItem[]> {
    const result = await this.client.query<SeoRedirectItem>(
      `SELECT * FROM seo_redirects WHERE is_active = TRUE ORDER BY created_at DESC`
    );
    return result.rows;
  }
  
  async getByFromPath(fromPath: string): Promise<SeoRedirectItem | null> {
    const result = await this.client.query<SeoRedirectItem>(
      `SELECT * FROM seo_redirects WHERE from_path = $1 AND is_active = TRUE`,
      [fromPath]
    );
    return result.rows[0] ?? null;
  }
}
```

---

## 4. Deterministic Fallback Templates

### 4.1 Route Templates

**Tour Packages:**
- Title: `{Package Name} - {Duration} Tour Package from {Source} | Agra SK Baghel Tour & Travels`
- Description: `Book {Package Name} tour package. {Duration} days. {Inclusions}. Best rates guaranteed.`
- Canonical: `/packages/{slug}`
- Schema: `TourPackage`

**Routes:**
- Title: `{Source} to {Destination} Taxi - Book Online | Agra SK Baghel Tour & Travels`
- Description: `Book affordable taxi from {Source} to {Destination}. {Distance} km. {Duration}. 24/7 support.`
- Canonical: `/routes/{slug}`
- Schema: `Product`

**Local Packages:**
- Title: `{Package Name} - {Duration} Local Sightseeing | Agra SK Baghel Tour & Travels`
- Description: `Book {Package Name} local sightseeing package. {Duration} hours. {Inclusions}. Best rates guaranteed.`
- Canonical: `/packages/local/{slug}`
- Schema: `Product`

**Transfers:**
- Title: `{Route Name} Transfer - Airport/Railway Station Taxi | Agra SK Baghel Tour & Travels`
- Description: `Book {Route Name} transfer. {Distance} km. {Duration}. 24/7 airport/railway station service.`
- Canonical: `/transfers/{slug}`
- Schema: `Service`

**Monuments:**
- Title: `{Monument Name} - Entry Tickets, Timings, History | Agra SK Baghel Tour & Travels`
- Description: `Visit {Monument Name}. Book entry tickets online. {Description}. Best prices guaranteed.`
- Canonical: `/monuments/{slug}`
- Schema: `LocalBusiness`

### 4.2 Fallback Logic

```typescript
export function getSeoFallback(pathname: string): SeoMetadata {
  // Check database-backed metadata first
  const dbMetadata = seoMetadataRepo.getByPath(pathname);
  if (dbMetadata) return dbMetadata;
  
  // Fall back to deterministic template based on route type
  if (pathname.startsWith('/packages/')) {
    return getTourPackageFallback(pathname);
  } else if (pathname.startsWith('/routes/')) {
    return getRouteFallback(pathname);
  } else if (pathname.startsWith('/packages/local/')) {
    return getLocalPackageFallback(pathname);
  } else if (pathname.startsWith('/transfers/')) {
    return getTransferFallback(pathname);
  } else if (pathname.startsWith('/monuments/')) {
    return getMonumentFallback(pathname);
  }
  
  // Default fallback
  return getDefaultFallback(pathname);
}
```

---

## 5. SEO Validation Engine

### 5.1 Validation Rules

**Title Validation:**
- Required: Yes
- Length: 10-70 characters
- Unique: Yes (per page)

**Description Validation:**
- Required: Yes
- Length: 50-170 characters
- Unique: Yes (per page)

**Canonical Validation:**
- Required: Yes
- Format: Valid URL
- Unique: Yes (per page)

**Image Validation:**
- Required: Yes (for most pages)
- Format: Valid URL
- Size: Minimum 1200x630px

**Schema Validation:**
- Required: Yes (for most pages)
- Format: Valid JSON-LD
- Type: Valid schema type

### 5.2 Validation Schema

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

### 5.3 Validation Engine API

```typescript
export interface SEOValidationEngine {
  validatePage(url: string): Promise<ValidationResult>;
  validateMetadata(metadata: SeoMetadataItem): ValidationResult;
  validateSchema(schema: SchemaData): ValidationResult;
}

export class SEOValidationEngineImpl implements SEOValidationEngine {
  async validatePage(url: string): Promise<ValidationResult> {
    // Validate all SEO aspects for page
  }
  
  async validateMetadata(metadata: SeoMetadataItem): Promise<ValidationResult> {
    // Validate metadata
  }
  
  async validateSchema(schema: SchemaData): Promise<ValidationResult> {
    // Validate schema
  }
}
```

---

## 6. SEO Dashboard

### 6.1 Dashboard Metrics

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

### 6.2 Dashboard Schema

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

### 6.3 Dashboard API

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

## 7. SEO Publishing Rules

### 7.1 Indexability Rules

A page is indexable if:
- Status is 'published'
- Title is present and valid
- Description is present and valid
- Canonical URL is valid
- No 'noindex' directive
- Content meets minimum quality requirements

### 7.2 Publishing Workflow

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

## 8. Conclusion

This SEO engine documentation provides a comprehensive framework for managing SEO in the Agra SK Baghel Tour & Travels platform.

**Key Takeaways:**
1. Database-driven SEO with `seo_metadata` and `seo_redirects` tables
2. Deterministic fallback templates for all route types
3. Automated SEO validation across all public pages
4. Real-time SEO monitoring with dashboard
5. Admin SEO Control Center for manual overrides

**Next Steps:**
1. Implement metadata manager
2. Build redirect manager
3. Create fallback template engine
4. Set up SEO validation engine
5. Build SEO dashboard
