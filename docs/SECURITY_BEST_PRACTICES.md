# Security Best Practices Guide — SK Baghel Tour & Travels

## 1. Executive Summary

This document outlines the comprehensive security strategy for SK Baghel Tour & Travels, covering authentication, authorization, data protection, payment security, and compliance. The strategy follows industry best practices and regulatory requirements to ensure the highest level of security for users, data, and business operations.

**Security Principles:**
- Defense in depth
- Least privilege access
- Secure by default
- Regular security audits
- Incident response readiness

**Compliance Requirements:**
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- PCI-DSS (Payment Card Industry Data Security Standard)
- Indian IT Act, 2000
- DPDP Act (Digital Personal Data Protection Act, 2023)

---

## 2. Authentication Security

### 2.1 JWT Token Security

**Implementation:** [`backend/src/middlewares/authGuard.ts`](../backend/src/middlewares/authGuard.ts)

**Key Security Features:**

1. **Token Verification**
   - Uses `jose` library for JWT verification
   - Validates issuer (`iss`) and audience (`aud`) claims
   - Checks token expiration (`exp`)
   - Rejects tokens with invalid signatures

2. **JWKS Caching**
   - Implements JWKS (JSON Web Key Set) caching to reduce external requests
   - Cache key is the normalized Supabase URL
   - Prevents token replay attacks

3. **Role Validation**
   - Only trusts `app_metadata.role` (server-controlled)
   - Never trusts `user_metadata.role` (client-writable)
   - Validates role against allowed roles list

4. **Email Whitelist**
   - Admin access restricted to specific email addresses
   - `ADMIN_EMAIL` environment variable controls access
   - Case-insensitive email comparison

**Security Best Practices:**

```typescript
// Token validation
const { payload } = await jwtVerify(token, jwks, {
  issuer: [`${normalizedUrl}/auth/v1`, normalizedUrl, "supabase"],
  audience: "authenticated",
});

// Role validation - only trust server-controlled metadata
const appMeta = asRecord(payload.app_metadata);
const roleRaw = String(appMeta.role ?? "customer").trim();
const role = USER_ROLES.includes(roleRaw as UserRole) ? (roleRaw as UserRole) : "customer";
```

### 2.2 Authentication Flow

**Customer Authentication:**
1. Sign up with email/password or Google OAuth
2. Supabase handles password hashing (bcrypt)
3. JWT tokens issued on successful authentication
4. Tokens stored in secure HTTP-only cookies (optional) or localStorage
5. Automatic token refresh before expiration

**Admin Authentication:**
1. Email/password authentication via Supabase
2. Email whitelist enforcement
3. Role-based access control
4. Session timeout after inactivity
5. Audit logging for all admin actions

### 2.3 Password Security

**Best Practices:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Password history (prevent reuse)
- Account lockout after 5 failed attempts

**Implementation:**
- Supabase handles password hashing with bcrypt
- Passwords never stored in application logs
- Password reset tokens expire after 1 hour

---

## 3. Authorization Security

### 3.1 Role-Based Access Control (RBAC)

**Implementation:** [`backend/src/middlewares/roleGuard.ts`](../backend/src/middlewares/roleGuard.ts)

**Role Hierarchy:**
```
super_admin (full access)
├── content_editor (content management)
├── review_moderator (review moderation)
├── dispatcher (booking dispatch)
└── finance_operator (finance operations)
```

**Role Permissions:**

| Role | Content | Reviews | Dispatch | Finance | Admin |
|------|---------|---------|----------|---------|-------|
| super_admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| content_editor | ✓ | ✗ | ✗ | ✗ | ✗ |
| review_moderator | ✗ | ✓ | ✗ | ✗ | ✗ |
| dispatcher | ✗ | ✗ | ✓ | ✗ | ✗ |
| finance_operator | ✗ | ✗ | ✗ | ✓ | ✗ |

**Authorization Middleware:**

```typescript
export function requireRole(request: FastifyRequest, roles: readonly UserRole[]): void {
  const user = request.user;
  if (!user) throw Errors.unauthorized();
  if (user.role === "super_admin") return;
  if (!roles.includes(user.role)) {
    throw Errors.forbidden("Insufficient role for this operations endpoint.");
  }
}
```

### 3.2 Resource-Level Authorization

**Booking Access:**
- Customers can only access their own bookings
- Admins can access all bookings
- Guest bookings require token verification

**Payment Access:**
- Customers can only access their own payment information
- Admins can access all payment information
- Payment webhook verification ensures data integrity

**Data Access:**
- Row-Level Security (RLS) policies in PostgreSQL
- Tenant isolation for multi-tenant data
- Audit logging for sensitive operations

---

## 4. Data Protection

### 4.1 Database Security

**Implementation:** [`backend/src/db/postgres.ts`](../backend/src/db/postgres.ts)

**Security Features:**

1. **Row-Level Security (RLS)**
   - Enables per-row access control
   - Prevents unauthorized data access
   - Tenant isolation for multi-tenant data

2. **Parameterized Queries**
   - Prevents SQL injection attacks
   - Uses pg library's built-in parameterization
   - Never concatenates user input into queries

3. **Connection Pooling**
   - Secure connection management
   - Automatic connection cleanup
   - Connection timeout configuration

**Example RLS Policy:**
```sql
-- Customers can only see their own bookings
CREATE POLICY customer_booking_policy ON bookings
  FOR SELECT
  USING (user_id = auth.uid() OR guest_access_token = current_setting('app.guest_token', true));

-- Admins can see all bookings
CREATE POLICY admin_booking_policy ON bookings
  FOR SELECT
  USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  ));
```

### 4.2 Data Encryption

**At Rest:**
- PostgreSQL encryption at rest (if using managed service)
- Database backups encrypted
- Sensitive data encrypted with AES-256

**In Transit:**
- TLS 1.3 for all external connections
- HTTPS for all API endpoints
- Secure WebSocket connections

**Sensitive Data Fields:**
- Phone numbers (encrypted)
- Email addresses (encrypted)
- Payment information (never stored)
- PII data (minimized and encrypted)

### 4.3 Data Minimization

**Best Practices:**
- Collect only necessary data
- Delete data when no longer needed
- Anonymize data for analytics
- Limit data retention periods

**Data Retention:**
- Active bookings: 7 years (legal requirement)
- Completed bookings: 7 years
- Inactive accounts: 2 years
- Analytics data: 1 year
- Audit logs: 5 years

---

## 5. Payment Security

### 5.1 Razorpay Integration

**Implementation:** [`backend/src/modules/payments/payment.service.ts`](../backend/src/modules/payments/payment.service.ts)

**Security Features:**

1. **Server-Authoritative Pricing**
   - Client never determines prices
   - All pricing calculated server-side
   - Price validation before payment creation

2. **Payment Verification**
   - Webhook signature verification
   - Order ID and payment ID matching
   - Amount verification
   - Idempotency key for replay protection

3. **Return URL Validation**
   - Prevents open redirect attacks
   - Only allows configured origins
   - HTTPS required in production

**Security Implementation:**

```typescript
// Server-authoritative pricing
const amountMinor = rupeesToPaise(booking.advanceAmount);
if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
  throw new AppError("INVALID_AMOUNT", "Invalid booking amount.", 500);
}

// Return URL validation
const allowedOrigins = deps.env.CORS_ORIGINS.split(",").map((s) => s.trim());
if (input.returnUrl && !isAllowedReturnUrl(input.returnUrl, allowedOrigins)) {
  throw Errors.validation([{ path: "returnUrl", message: "Return URL not allowed" }]);
}
```

### 5.2 PCI-DSS Compliance

**Requirements:**
- Never store full card numbers
- Never store CVV codes
- Use tokenization for recurring payments
- Encrypt all card data in transit
- Limit card data access

**Implementation:**
- Razorpay handles all card data
- Only store payment provider IDs
- No card data stored in application database
- Payment webhooks verified with signatures

### 5.3 Payment Webhook Security

**Webhook Verification:**
1. Verify webhook signature
2. Check event ID for replay protection
3. Validate amount matches order
4. Update payment status atomically
5. Log all webhook events

**Security Implementation:**

```typescript
// Webhook signature verification
const signature = request.headers["x-razorpay-signature"] as string;
const isValid = verifyWebhookSignature(body, signature, webhookSecret);

if (!isValid) {
  throw Errors.forbidden("Invalid webhook signature.");
}
```

---

## 6. API Security

### 6.1 CORS Configuration

**Implementation:** [`backend/src/config/env.ts`](../backend/src/config/env.ts)

**Best Practices:**
- Whitelist allowed origins
- Never use wildcard (*) in production
- Limit HTTP methods
- Limit headers

**Configuration:**
```typescript
CORS_ORIGINS: "https://agraskbagheltourandtravels.com,https://admin.agraskbagheltourandtravels.com"
```

### 6.2 Rate Limiting

**Best Practices:**
- Limit requests per IP per minute
- Different limits for different endpoints
- Gradual blocking (warning → temporary block → permanent block)
- Exempt trusted IPs

**Implementation:**
- Cloudflare rate limiting
- Backend rate limiting (optional)
- API Gateway rate limiting

### 6.3 Input Validation

**Best Practices:**
- Validate all user input
- Sanitize input data
- Use type-safe schemas (Zod)
- Reject invalid data early

**Implementation:**
```typescript
// Zod schema validation
const CreateBookingSchema = z.object({
  pickupLocation: z.string().min(1),
  dropLocation: z.string().min(1),
  pickupDate: z.string().datetime(),
  returnDate: z.string().datetime().optional(),
  passengers: z.number().int().min(1).max(10),
  vehicleType: z.string().min(1),
});
```

### 6.4 Error Handling

**Best Practices:**
- Never expose internal errors to users
- Log detailed errors server-side
- Return generic error messages to clients
- Include error IDs for debugging

**Implementation:** [`backend/src/shared/errors.ts`](../backend/src/shared/errors.ts)

```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}
```

---

## 7. Infrastructure Security

### 7.1 Environment Variables

**Best Practices:**
- Never commit secrets to version control
- Use environment-specific configs
- Rotate secrets regularly
- Use secret management services

**Implementation:** [`backend/.env.example`](../backend/.env.example)

**Required Environment Variables:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_JWT_SECRET` - JWT signing secret
- `RAZORPAY_KEY_ID` - Razorpay API key
- `RAZORPAY_KEY_SECRET` - Razorpay API secret
- `ADMIN_EMAIL` - Admin email whitelist
- `CORS_ORIGINS` - Allowed CORS origins

### 7.2 Secret Management

**Best Practices:**
- Use environment variables for secrets
- Rotate secrets every 90 days
- Use different secrets for each environment
- Audit secret access

**Implementation:**
- Secrets stored in environment variables
- No secrets in code or configuration files
- Secrets encrypted at rest in CI/CD

### 7.3 Logging Security

**Best Practices:**
- Never log sensitive data (passwords, cards, PII)
- Log security events (login, logout, password change)
- Use structured logging
- Implement log rotation

**Implementation:** [`backend/src/server.ts`](../backend/src/server.ts)

```typescript
// PII redaction
const redactedBody = redactPii(request.body);
logger.info("Request received", { method, url, body: redactedBody });
```

---

## 8. Security Monitoring

### 8.1 Security Events

**Events to Monitor:**
- Failed login attempts
- Successful logins
- Password changes
- Role changes
- Payment failures
- Webhook failures
- API abuse

**Implementation:**
- Audit logging in database
- CloudWatch alarms
- Email notifications for critical events

### 8.2 Intrusion Detection

**Best Practices:**
- Monitor for unusual traffic patterns
- Detect SQL injection attempts
- Detect XSS attempts
- Detect brute force attacks
- Alert on suspicious activity

**Implementation:**
- Cloudflare WAF rules
- Backend request validation
- Log analysis

### 8.3 Security Audits

**Monthly:**
- Review access logs
- Check for unauthorized access
- Verify encryption settings
- Review firewall rules

**Quarterly:**
- Penetration testing
- Vulnerability scanning
- Security policy review
- Incident response drill

**Annually:**
- Third-party security audit
- Compliance audit
- Security training
- Security policy update

---

## 9. Incident Response

### 9.1 Incident Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | Data breach, system compromise | 15 minutes |
| High | Service outage, security vulnerability | 1 hour |
| Medium | Minor security issue | 4 hours |
| Low | Non-critical security issue | 24 hours |

### 9.2 Incident Response Steps

1. **Identify**
   - Determine scope of incident
   - Identify affected systems
   - Document timeline

2. **Contain**
   - Isolate affected systems
   - Block malicious IPs
   - Revoke compromised credentials

3. **Eradicate**
   - Remove malware
   - Patch vulnerabilities
   - Reset compromised accounts

4. **Recover**
   - Restore from backup
   - Verify system integrity
   - Monitor for recurrence

5. **Lessons Learned**
   - Document incident
   - Update security policies
   - Conduct training

### 9.3 Contact Information

**Security Team:**
- Security Lead: [email]
- DevOps: [email]
- Backend: [email]

**External:**
- Cloudflare Security: security@cloudflare.com
- Supabase Security: security@supabase.io
- Razorpay Security: security@razorpay.com

---

## 10. Compliance

### 10.1 GDPR Compliance

**Requirements:**
- Explicit consent for data collection
- Right to access personal data
- Right to erasure (right to be forgotten)
- Right to data portability
- Data protection officer (DPO)
- Privacy policy

**Implementation:**
- Consent management system
- Data export functionality
- Data deletion functionality
- Privacy policy on website
- Data processing agreements

### 10.2 CCPA Compliance

**Requirements:**
- Notice at collection
- Right to know
- Right to delete
- Right to opt-out
- Non-discrimination

**Implementation:**
- Privacy policy
- Cookie consent banner
- Data deletion functionality
- Opt-out mechanism

### 10.3 PCI-DSS Compliance

**Requirements:**
- Build and maintain secure network
- Protect cardholder data
- Maintain vulnerability management program
- Implement strong access control measures
- Regularly monitor and test networks
- Maintain information security policy

**Implementation:**
- Razorpay handles card data
- No card data stored in application
- Secure API communication
- Regular security audits

### 10.4 DPDP Act (India)

**Requirements:**
- Consent for data processing
- Data minimization
- Purpose limitation
- Data accuracy
- Storage limitation
- Integrity and confidentiality
- Accountability

**Implementation:**
- Consent management
- Data minimization
- Privacy policy
- Data protection officer
- Data processing agreements

---

## 11. Security Checklist

### 11.1 Pre-Launch Checklist

- [ ] All secrets stored in environment variables
- [ ] CORS configured with whitelist
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] JWT token verification implemented
- [ ] Role-based access control implemented
- [ ] Row-Level Security enabled
- [ ] Payment webhook signature verification
- [ ] SSL/TLS enabled
- [ ] Security headers configured
- [ ] Audit logging enabled
- [ ] Incident response plan documented

### 11.2 Post-Launch Checklist

- [ ] Security monitoring enabled
- [ ] Alerting configured
- [ ] Regular security audits scheduled
- [ ] Security training completed
- [ ] Incident response drill completed
- [ ] Penetration testing completed
- [ ] Vulnerability scanning scheduled

### 11.3 Ongoing Security Tasks

**Daily:**
- Monitor security logs
- Check for unusual activity
- Review failed login attempts

**Weekly:**
- Review access logs
- Check for security updates
- Monitor for vulnerabilities

**Monthly:**
- Security audit
- Review security policies
- Update security configurations

**Quarterly:**
- Penetration testing
- Vulnerability scanning
- Security training

**Annually:**
- Third-party security audit
- Compliance audit
- Security policy update

---

## 12. Security Resources

### 12.1 Official Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [PCI-DSS Requirements](https://www.pcisecuritystandards.org/)

### 12.2 Tools

- [OWASP ZAP](https://www.zaproxy.org/) - Web application security scanner
- [Nessus](https://www.tenable.com/products/nessus) - Vulnerability scanner
- [Nmap](https://nmap.org/) - Network scanner
- [Burp Suite](https://portswigger.net/burp) - Web application security testing

### 12.3 Services

- [Cloudflare WAF](https://www.cloudflare.com/products/waf/) - Web application firewall
- [AWS WAF](https://aws.amazon.com/waf/) - Web application firewall
- [Google Cloud Armor](https://cloud.google.com/armor) - Web application firewall

---

## 13. Conclusion

This Security Best Practices Guide provides a comprehensive framework for maintaining and improving SK Baghel Tour & Travels' security posture. By following these guidelines, the organization can protect user data, maintain business continuity, and comply with regulatory requirements.

**Key Takeaways:**
1. Implement defense in depth with multiple security layers
2. Use least privilege access for all users and systems
3. Secure by default - all security features enabled
4. Regular security audits and monitoring
5. Incident response readiness

**Next Steps:**
1. Implement all security recommendations
2. Set up security monitoring and alerting
3. Schedule regular security audits
4. Conduct security training for all team members
5. Develop and document incident response plan
