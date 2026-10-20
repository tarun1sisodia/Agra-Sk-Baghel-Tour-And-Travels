import type pg from "pg";

export interface ReviewLinkEntity {
  id: string;
  kind: "qr" | "booking";
  token_hash: string;
  booking_id: string | null;
  label: string | null;
  prefill: Record<string, any>;
  expires_at: string | null;
  revoked_at: string | null;
  used_at: string | null;
  email_sent_at: string | null;
  email_last_error: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ReviewSubmissionEntity {
  id: string;
  link_id: string;
  booking_id: string | null;
  display_name: string;
  rating: number | null;
  review_text: string;
  tour_name: string | null;
  route_text: string | null;
  social_platform: "instagram" | "facebook" | "youtube" | "x" | "linkedin" | null;
  social_username: string | null;
  consent_public: boolean;
  status: "pending" | "approved" | "rejected";
  show_on_homepage: boolean;
  show_in_gallery: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface ReviewImageEntity {
  id: string;
  submission_id: string;
  storage_key: string;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  sort_order: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export class ReviewsRepository {
  constructor(private pool: pg.Pool) {}

  async createReviewLink(data: {
    kind: "qr" | "booking";
    token_hash: string;
    booking_id?: string | null;
    label?: string | null;
    prefill?: Record<string, any>;
    expires_at?: string | null;
    created_by?: string | null;
  }): Promise<ReviewLinkEntity> {
    const res = await this.pool.query(
      `
      INSERT INTO review_links (
        kind, token_hash, booking_id, label, prefill, expires_at, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, (SELECT id FROM profiles WHERE id::text = $7::text))
      RETURNING *
    `,
      [
        data.kind,
        data.token_hash,
        data.booking_id ?? null,
        data.label ?? null,
        JSON.stringify(data.prefill ?? {}),
        data.expires_at ?? null,
        data.created_by ?? null,
      ]
    );
    const r = res.rows[0];
    return {
      ...r,
      prefill: typeof r.prefill === "string" ? JSON.parse(r.prefill) : r.prefill,
    };
  }

  async getReviewLinkByHash(tokenHash: string): Promise<ReviewLinkEntity | null> {
    const res = await this.pool.query(
      "SELECT * FROM review_links WHERE token_hash = $1",
      [tokenHash]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      prefill: typeof r.prefill === "string" ? JSON.parse(r.prefill) : r.prefill,
    };
  }

  async getReviewImageById(id: string): Promise<ReviewImageEntity | null> {
    const res = await this.pool.query("SELECT * FROM review_images WHERE id = $1", [id]);
    return res.rows[0] ?? null;
  }

  async getReviewLinkById(id: string): Promise<ReviewLinkEntity | null> {
    const res = await this.pool.query(
      "SELECT * FROM review_links WHERE id = $1",
      [id]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      prefill: typeof r.prefill === "string" ? JSON.parse(r.prefill) : r.prefill,
    };
  }

  async markLinkUsed(id: string): Promise<void> {
    await this.pool.query(
      "UPDATE review_links SET used_at = NOW() WHERE id = $1",
      [id]
    );
  }

  async revokeLink(id: string): Promise<void> {
    await this.pool.query(
      "UPDATE review_links SET revoked_at = NOW() WHERE id = $1",
      [id]
    );
  }

  async updateLinkEmailStatus(id: string, success: boolean, error?: string): Promise<void> {
    if (success) {
      await this.pool.query(
        "UPDATE review_links SET email_sent_at = NOW(), email_last_error = NULL WHERE id = $1",
        [id]
      );
    } else {
      await this.pool.query(
        "UPDATE review_links SET email_last_error = $1 WHERE id = $2",
        [error ?? "Failed to send email", id]
      );
    }
  }

  async createSubmission(data: {
    link_id: string;
    booking_id?: string | null;
    display_name: string;
    rating?: number | null;
    review_text: string;
    tour_name?: string | null;
    route_text?: string | null;
    social_platform?: "instagram" | "facebook" | "youtube" | "x" | "linkedin" | null;
    social_username?: string | null;
    consent_public: boolean;
  }): Promise<ReviewSubmissionEntity> {
    const res = await this.pool.query(
      `
      INSERT INTO review_submissions (
        link_id, booking_id, display_name, rating, review_text, tour_name, route_text,
        social_platform, social_username, consent_public, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
      RETURNING *
    `,
      [
        data.link_id,
        data.booking_id ?? null,
        data.display_name,
        data.rating ?? null,
        data.review_text,
        data.tour_name ?? null,
        data.route_text ?? null,
        data.social_platform ?? null,
        data.social_username ?? null,
        data.consent_public,
      ]
    );
    return res.rows[0];
  }

  async addReviewImage(data: {
    submission_id: string;
    storage_key: string;
    width?: number | null;
    height?: number | null;
    alt_text?: string | null;
    sort_order?: number;
  }): Promise<ReviewImageEntity> {
    const res = await this.pool.query(
      `
      INSERT INTO review_images (
        submission_id, storage_key, width, height, alt_text, sort_order, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *
    `,
      [
        data.submission_id,
        data.storage_key,
        data.width ?? null,
        data.height ?? null,
        data.alt_text ?? null,
        data.sort_order ?? 0,
      ]
    );
    return res.rows[0];
  }

  async getSubmissionById(id: string): Promise<ReviewSubmissionEntity | null> {
    const res = await this.pool.query(
      "SELECT * FROM review_submissions WHERE id = $1",
      [id]
    );
    return res.rows[0] || null;
  }

  async getImagesBySubmissionId(submissionId: string): Promise<ReviewImageEntity[]> {
    const res = await this.pool.query(
      "SELECT * FROM review_images WHERE submission_id = $1 ORDER BY sort_order ASC",
      [submissionId]
    );
    return res.rows;
  }

  async updateSubmission(
    id: string,
    data: {
      status?: "pending" | "approved" | "rejected";
      show_on_homepage?: boolean;
      show_in_gallery?: boolean;
      review_text?: string;
      display_name?: string;
      reviewed_by?: string;
      rejection_reason?: string | null;
    }
  ): Promise<ReviewSubmissionEntity> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        updates.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }
    updates.push(`reviewed_at = NOW()`);
    values.push(id);

    const res = await this.pool.query(
      `UPDATE review_submissions SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.rows[0];
  }

  async updateImageStatus(
    id: string,
    status: "approved" | "rejected"
  ): Promise<ReviewImageEntity> {
    const res = await this.pool.query(
      "UPDATE review_images SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    return res.rows[0];
  }

  async listAdminSubmissions(filter?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Array<ReviewSubmissionEntity & {
    booking_ticket_id: string | null;
    booking_status: string | null;
    is_verified_booking: boolean;
    images: ReviewImageEntity[];
  }>> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (filter?.status && filter.status !== "all") {
      conditions.push(`s.status = $${idx++}`);
      values.push(filter.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limitClause = filter?.limit ? `LIMIT $${idx++}` : "LIMIT 100";
    if (filter?.limit) values.push(filter.limit);
    const offsetClause = filter?.offset ? `OFFSET $${idx++}` : "";
    if (filter?.offset) values.push(filter.offset);

    const res = await this.pool.query(
      `
      SELECT 
        s.*,
        b.ticket_id AS booking_ticket_id,
        b.status AS booking_status,
        (s.booking_id IS NOT NULL AND b.status = 'completed') AS is_verified_booking,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', img.id,
                'submission_id', img.submission_id,
                'storage_key', img.storage_key,
                'width', img.width,
                'height', img.height,
                'alt_text', img.alt_text,
                'sort_order', img.sort_order,
                'status', img.status,
                'created_at', img.created_at
              ) ORDER BY img.sort_order ASC
            )
            FROM review_images img
            WHERE img.submission_id = s.id
          ),
          '[]'::json
        ) AS images
      FROM review_submissions s
      LEFT JOIN bookings b ON s.booking_id = b.id
      ${whereClause}
      ORDER BY s.created_at DESC
      ${limitClause} ${offsetClause}
    `,
      values
    );

    return res.rows.map((r) => ({
      ...r,
      is_verified_booking: Boolean(r.is_verified_booking),
      images: Array.isArray(r.images) ? r.images : [],
    }));
  }

  async getPublicReviews(): Promise<Array<ReviewSubmissionEntity & { is_verified: boolean }>> {
    const res = await this.pool.query(`
      SELECT
        s.*,
        TRUE AS is_verified
      FROM review_submissions s
      WHERE s.status = 'approved'
        AND s.consent_public = true
        AND s.show_on_homepage = true
      ORDER BY s.created_at DESC
      LIMIT 30
    `);
    return res.rows.map((r) => ({
      ...r,
      is_verified: Boolean(r.is_verified),
    }));
  }

  async getPublicGallery(): Promise<Array<ReviewImageEntity & { reviewer_name: string; review_text: string }>> {
    const res = await this.pool.query(`
      SELECT
        img.*,
        sub.display_name AS reviewer_name,
        sub.review_text AS review_text
      FROM review_images img
      JOIN review_submissions sub ON img.submission_id = sub.id
      WHERE img.status = 'approved'
        AND sub.status = 'approved'
        AND sub.consent_public = true
        AND sub.show_in_gallery = true
      ORDER BY img.sort_order ASC, img.created_at DESC
    `);
    return res.rows;
  }

  async enqueuePublishEvent(
    entityId: string,
    eventType: "published" | "updated" | "archived" | "review_approved"
  ): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO site_publish_events (entity_type, entity_id, event_type, status)
      VALUES ('review', $1, $2, 'pending')
      ON CONFLICT (entity_type, entity_id, event_type) WHERE status = 'pending' DO NOTHING
      `,
      [entityId, eventType]
    );
  }
}
