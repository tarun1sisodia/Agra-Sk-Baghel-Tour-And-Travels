# Publishing Infrastructure Documentation — Agra SK Baghel Tour & Travels

## 1. Overview

This document defines the publishing infrastructure for Agra SK Baghel Tour & Travels platform.

**Publishing Vision:**
- Database-driven publishing (no developer involvement for content updates)
- Transactional publishing events
- Cache and page synchronization
- Reliable content-to-website synchronization

**Key Components:**
- Publishing outbox for event tracking
- Validation engine for content quality
- Publication workflow for approval
- Cache synchronization for CDN invalidation
- Sitemap generation for SEO

---

## 2. Publishing Architecture

### 2.1 Publishing Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Publishing Flow                              │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Admin creates or edits content                                   │
│    ↓                                                                │
│ 2. Database stores a draft (status = 'draft')                       │
│    ↓                                                                │
│ 3. Validation engine checks required fields, SEO metadata           │
│    ↓                                                                │
│ 4. Admin clicks "Publish"                                           │
│    ↓                                                                │
│ 5. Transactional publishing event created (status = 'pending')      │
│    ↓                                                                │
│ 6. Publishing worker processes the event                            │
│    ↓                                                                │
│ 7. Content updated in database (status = 'published')               │
│    ↓                                                                │
│ 8. Cache and page synchronization                                   │
│    ↓                                                                │
│ 9. Sitemap regenerated                                              │
│    ↓                                                                │
│ 10. CDN cache invalidated                                           │
│    ↓                                                                │
│ 11. Verification (public URL, HTTP status, metadata)                │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Publishing States

| State | Description |
|-------|-------------|
| draft | Content is being created or edited |
| published | Content is live and visible to public |
| archived | Content is no longer active but preserved |
| needs_review | Content requires editorial review before publishing |

### 2.3 Publishing Events

```typescript
export interface PublishEvent {
  id: string;
  contentType: string;
  contentId: string;
  action: "create" | "update" | "delete" | "publish" | "unpublish";
  status: "pending" | "processing" | "completed" | "failed";
  retryCount: number;
  lastAttemptAt: string | null;
  completedAt: string | null;
  error: string | null;
  createdAt: string;
}
```

---

## 3. Publishing Outbox

### 3.1 Database Schema

```sql
CREATE TABLE publishing_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(100) NOT NULL,
  content_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_publishing_outbox_status ON publishing_outbox(status);
CREATE INDEX idx_publishing_outbox_content_type ON publishing_outbox(content_type);
CREATE INDEX idx_publishing_outbox_content_id ON publishing_outbox(content_id);
```

### 3.2 Event Types

| Action | Description |
|--------|-------------|
| create | New content created |
| update | Existing content updated |
| delete | Content deleted |
| publish | Content published |
| unpublish | Content unpublished |

### 3.3 Event Processing

```typescript
export interface PublishEventProcessor {
  process(event: PublishEvent): Promise<void>;
}

export class ContentPublishProcessor implements PublishEventProcessor {
  async process(event: PublishEvent): Promise<void> {
    // 1. Update content status
    // 2. Update public content API
    // 3. Update static pages
    // 4. Invalidate CDN cache
    // 5. Update sitemap
    // 6. Mark event as completed
  }
}
```

---

## 4. Validation Engine

### 4.1 Validation Rules

**Required Fields:**
- Title
- Slug
- Description
- Images (if applicable)

**SEO Validation:**
- Title length (50-60 characters)
- Description length (150-160 characters)
- Unique slug
- Valid canonical URL
- Required metadata fields

**Content Validation:**
- Minimum word count (300 words for content pages)
- No broken internal links
- Image alt text present
- No duplicate content

### 4.2 Validation Engine

```typescript
export interface ContentValidator {
  validate(content: any): ValidationResult;
}

export class TourPackageValidator implements ContentValidator {
  validate(package: TourPackageItem): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!package.title || package.title.length < 1) {
      errors.push({ field: 'title', message: 'Title is required' });
    }
    
    if (!package.slug || package.slug.length < 1) {
      errors.push({ field: 'slug', message: 'Slug is required' });
    }
    
    if (!package.description || package.description.length < 100) {
      errors.push({ field: 'description', message: 'Description must be at least 100 characters' });
    }
    
    return { valid: errors.length === 0, errors };
  }
}
```

### 4.3 Validation Results

```typescript
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}
```

---

## 5. Publication Workflow

### 5.1 Draft to Published Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Publication Workflow                             │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Admin creates content (status = 'draft')                         │
│    ↓                                                                 │
│ 2. Admin edits content (status = 'draft')                           │
│    ↓                                                                 │
│ 3. Admin clicks "Preview"                                           │
│    ↓                                                                 │
│ 4. System validates content                                         │
│    ↓                                                                 │
│ 5. If valid: Admin clicks "Publish"                                 │
│    ↓                                                                 │
│ 6. System creates publishing event (status = 'pending')             │
│    ↓                                                                 │
│ 7. Publishing worker processes event                                │
│    ↓                                                                 │
│ 8. Content status updated to 'published'                            │
│    ↓                                                                 │
│ 9. Public URL becomes accessible                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Approval Workflow

**For sensitive content:**
1. Admin creates content (status = 'draft')
2. Admin clicks "Submit for Review"
3. Super_admin reviews content
4. Super_admin approves or requests modifications
5. If approved: Content published
6. If modifications needed: Content returned to draft

---

## 6. Cache Synchronization

### 6.1 Cache Invalidation

**Cache Types:**
- CDN cache (Cloudflare)
- API cache (Redis)
- Static page cache

**Invalidation Triggers:**
- Content published
- Content updated
- Content deleted
- Sitemap updated

### 6.2 CDN Invalidation

```typescript
export class CDNInvalidator {
  async invalidate(path: string): Promise<void> {
    // Invalidate Cloudflare cache
    await cloudflare.invalidate(path);
  }
  
  async invalidateAll(): Promise<void> {
    // Invalidate all Cloudflare cache
    await cloudflare.invalidateAll();
  }
}
```

### 6.3 API Cache Invalidation

```typescript
export class APICacheInvalidator {
  async invalidateContentType(contentType: string): Promise<void> {
    // Invalidate API cache for content type
    await redis.del(`api:content:${contentType}`);
  }
  
  async invalidateContentId(contentId: string): Promise<void> {
    // Invalidate API cache for content ID
    await redis.del(`api:content:${contentId}`);
  }
}
```

---

## 7. Sitemap Generation

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

### 7.2 Sitemap Generation

```typescript
export class SitemapGenerator {
  async generate(): Promise<string> {
    const entries = await this.getContentEntries();
    return this.generateXml(entries);
  }
  
  private async getContentEntries(): Promise<SitemapEntry[]> {
    // Query published content from database
    // Return entries with path, lastmod, changefreq, priority
  }
  
  private generateXml(entries: SitemapEntry[]): string {
    // Generate XML sitemap
  }
}
```

### 7.3 Sitemap Update Triggers

- Content published
- Content updated
- Content deleted
- Scheduled update (daily)

---

## 8. Publication Worker

### 8.1 Worker Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Publishing Worker                            │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Poll publishing outbox for pending events                        │
│    ↓                                                                 │
│ 2. Process each event                                               │
│    ↓                                                                 │
│ 3. Update content status                                            │
│    ↓                                                                 │
│ 4. Update public content API                                        │
│    ↓                                                                 │
│ 5. Update static pages                                              │
│    ↓                                                                 │
│ 6. Invalidate CDN cache                                             │
│    ↓                                                                 │
│ 7. Update sitemap                                                   │
│    ↓                                                                 │
│ 8. Mark event as completed                                          │
│    ↓                                                                 │
│ 9. Handle failures (retry or log)                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Worker Implementation

```typescript
export class PublishingWorker {
  async processPendingEvents(): Promise<void> {
    const events = await this.getPendingEvents();
    
    for (const event of events) {
      try {
        await this.processEvent(event);
        await this.markEventCompleted(event.id);
      } catch (error) {
        await this.handleEventFailure(event.id, error);
      }
    }
  }
  
  private async processEvent(event: PublishEvent): Promise<void> {
    switch (event.action) {
      case 'publish':
        await this.publishContent(event);
        break;
      case 'unpublish':
        await this.unpublishContent(event);
        break;
      case 'update':
        await this.updateContent(event);
        break;
      case 'delete':
        await this.deleteContent(event);
        break;
    }
  }
}
```

---

## 9. Verification

### 9.1 Verification Checks

**Public URL:**
- URL is accessible
- HTTP status is 200
- Content is rendered correctly

**Metadata:**
- Title is present
- Description is present
- Canonical URL is correct
- Open Graph tags are present

**SEO:**
- H1 tag is present
- Meta description is present
- Schema.org JSON-LD is present
- Hreflang alternates are present

### 9.2 Verification Engine

```typescript
export interface VerificationResult {
  url: string;
  httpStatus: number;
  metadata: MetadataVerification;
  seo: SEOVerification;
}

export class PublisherVerifier {
  async verify(event: PublishEvent): Promise<VerificationResult> {
    const url = this.getContentUrl(event);
    const response = await fetch(url);
    
    return {
      url,
      httpStatus: response.status,
      metadata: this.verifyMetadata(response),
      seo: this.verifySEO(response)
    };
  }
}
```

---

## 10. Error Handling

### 10.1 Error Types

| Error Type | Description | Retry |
|------------|-------------|-------|
| Validation Error | Content fails validation | No |
| Network Error | CDN/API network failure | Yes (3 retries) |
| Database Error | Database connection failure | Yes (3 retries) |
| Permission Error | Insufficient permissions | No |
| Unknown Error | Unexpected error | Yes (3 retries) |

### 10.2 Error Recovery

```typescript
export class PublishingErrorHandler {
  async handleFailure(eventId: string, error: Error): Promise<void> {
    // Log error
    // Increment retry count
    // Update event status
    // Send notification if max retries exceeded
  }
}
```

---

## 11. Monitoring

### 11.1 Metrics

| Metric | Description |
|--------|-------------|
| Pending Events | Number of pending publishing events |
| Processing Time | Average time to process an event |
| Success Rate | Percentage of successful events |
| Failed Events | Number of failed events |
| CDN Invalidation Time | Average time to invalidate CDN cache |

### 11.2 Alerts

**Alert Thresholds:**
- Pending events > 100: High priority alert
- Success rate < 95%: Medium priority alert
- Processing time > 5s: Low priority alert

---

## 12. Conclusion

This publishing infrastructure documentation provides a comprehensive framework for managing content publishing in the Agra SK Baghel Tour & Travels platform.

**Key Takeaways:**
1. Database-driven publishing with no developer involvement
2. Transactional publishing events for reliability
3. Validation engine for content quality
4. Cache synchronization for CDN invalidation
5. Sitemap generation for SEO
6. Monitoring and alerting for operations

**Next Steps:**
1. Implement publishing outbox
2. Build validation engine
3. Create publishing worker
4. Set up cache synchronization
5. Configure monitoring and alerts
