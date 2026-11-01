# Security Best Practices Guide — Agra SK Baghel Tour & Travels

## 1. Executive Summary

This document outlines the comprehensive security strategy for Agra SK Baghel Tour & Travels, covering authentication, authorization, data protection, payment security, and compliance. The strategy follows industry best practices and regulatory requirements to ensure the highest level of security for users, data, and business operations.

**Security Principles:**
- Defense in depth
- Least privilege access
- Secure by default
- Regular security audits
- Incident response readiness

**Compliance Requirements:**
- DPDP Act (Digital Personal Data Protection Act, 2023) - **Primary focus**
- GDPR (General Data Protection Regulation) - Secondary compliance
- PCI-DSS (Payment Card Industry Data Security Standard) - Via Razorpay

---

## 2. Authentication Security

### 2.1 JWT Token Security with Asymmetric JWKS

**Implementation:** [`backend/src/middlewares/authGuard.ts`](../backend/src/middlewares/authGuard.ts)

**Key Security Features:**

1. **Asymmetric JWKS Verification**
   - Uses `jose` library for JWT verification
   - Fetches JWKS (JSON Web Key Set) from Supabase well-known endpoint
   - Validates issuer (`iss`) and audience (`aud`) claims
   - Checks token expiration (`exp`)
   - Rejects tokens with invalid signatures

2. **JWKS Caching**
   - Implements JWKS caching to reduce external requests
   - Cache key is the normalized Supabase URL
   - Prevents token replay attacks
   - Automatic refresh on key rotation

3. **Server-Controlled Role Extraction**
   - Only trusts `payload.app_metadata.role` (server-controlled)
   - Never trusts `payload.user_metadata.role` (client-writable)
   - Validates role against allowed roles list (`super_admin`, `developer`, `customer`)

4. **Email Whitelist**
   - Admin access restricted to specific email addresses
   - `ADMIN_EMAIL` environment variable controls access
   - Case-insensitive email comparison

**Security Implementation:**

```typescript
// Token validation with JWKS
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
3. Role-based access control (`super_admin` or `developer` only)
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

**Role Hierarchy (v3.0.0):**
```
super_admin (full access)
└── developer (limited: Content, Catalog, Fleet, Media, SEO, Publishing)
```

**Role Permissions:**

| Role | Content | Catalog | Fleet | Media | SEO | Publishing | Admin |
|------|---------|---------|-------|-------|-----|------------|-------|
| super_admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| developer | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |

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

## 4. Data Protection & DPDP Act 2023 Compliance

### 4.1 PII Masking

**Implementation:** [`backend/src/shared/pii.ts`](../backend/src/shared/pii.ts)

**PII Fields to Mask:**
- Phone numbers: `+91-XXXXX-XXXXX`
- Email addresses: `user@****.com`
- Names: `J*** S***`
- Addresses: Partial masking

**Masking Implementation:**

```typescript
export function maskPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length <= 6) return "XXXXXXX";
  return `+91-XXXXX-${cleaned.slice(-5)}`;
}

export function maskEmail(email: string): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return "****@****";
  return `${local.charAt(0)}***@${domain}`;
}
```

### 4.2 Data Minimization

**Best Practices:**
- Collect only necessary data
- Delete data when no longer needed
- Anonymize data for analytics
- Limit data retention periods

**Data Retention (DPDP Act 2023):**
- Active bookings: 7 years (legal requirement)
- Completed bookings: 7 years
- Inactive accounts: 2 years
- Analytics data: 1 year
- Audit logs: 5 years

### 4.3 Consent Management

**DPDP Act 2023 Requirements:**
- Explicit consent for data processing
- Purpose limitation (data used only for stated purpose)
- Data accuracy (customers can request corrections)
- Storage limitation (automatic deletion after retention period)
- Integrity and confidentiality (security measures)
- Accountability (data protection officer assigned)

**Implementation:**
- Consent management system
- Data export functionality
- Data deletion functionality
- Privacy policy on website
- Data processing agreements

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
   - Webhook signature verification (HMAC-SHA256)
   - Order ID and payment ID matching
   - Amount verification (`amount_paise`)
   - Idempotency key for replay protection

3. **Return URL Validation**
   - Prevents open redirect attacks
   - Only allows configured origins
   - HTTPS required in production

**Security Implementation:**

```typescript
// Server-authoritative pricing
const amountPaise = rupeesToPaise(booking.advanceAmount);
if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
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
1. Verify webhook signature (HMAC-SHA256)
2. Check event ID for replay protection
3. Validate amount matches order (`amount_paise`)
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
- Audit logging in database (`admin_audit_logs` table)
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

## 9. Zero Secret Leakage Guard

### 9.1 Build-Time Secret Scanning

**Implementation:** [`backend/scripts/audit-env-keys.ts`](../backend/scripts/audit-env-keys.ts)

**Checks:**
- No `.env` files committed to version control
- No secrets in build output (`react/dist`, `admin/dist`)
- No hardcoded credentials in source code
- No secrets in error messages or logs

### 9.2 Production Test-Auth Lockdown

**Implementation:** [`backend/src/config/env.ts`](../backend/src/config/env.ts)

**Production Rules:**
- `TEST_AUTH_ENABLED` must be `false` in production
- `ADMIN_EMAIL` whitelist enforced
- All admin routes require valid JWT
- No debug endpoints in production

**Enforcement:**

```typescript
if (isProduction && env.TEST_AUTH_ENABLED === "true") {
  throw new Error("TEST_AUTH_ENABLED must be false in production!");
}
```

---

## 10. Incident Response

### 10.1 Incident Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | Data breach, system compromise | 15 minutes |
| High | Service outage, security vulnerability | 1 hour |
| Medium | Minor security issue | 4 hours |
| Low | Non-critical security issue | 24 hours |

### 10.2 Incident Response Steps

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

### 10.3 Contact Information

**Security Team:**
- Security Lead: [email]
- DevOps: [email]
- Backend: [email]

**External:**
- Cloudflare Security: security@cloudflare.com
- Supabase Security: security@supabase.io
- Razorpay Security: security@razorpay.com

---

## 11. Compliance

### 11.1 DPDP Act 2023 Compliance (Primary Focus)

**Requirements:**
- Consent for data processing
- Data minimization
- Purpose limitation
- Data accuracy
- Storage limitation
- Integrity and confidentiality
- Accountability

**Implementation:**
- Consent management system
- Data minimization
- Privacy policy
- Data protection officer
- Data processing agreements

### 11.2 GDPR Compliance (Secondary)

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

### 11.3 PCI-DSS Compliance

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

---

## 12. Security Checklist

### 12.1 Pre-Launch Checklist

- [ ] All secrets stored in environment variables
- [ ] CORS configured with whitelist
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] JWT token verification with JWKS implemented
- [ ] Role-based access control implemented (`super_admin`, `developer` only)
- [ ] Row-Level Security enabled
- [ ] Payment webhook signature verification
- [ ] SSL/TLS enabled
- [ ] Security headers configured
- [ ] Audit logging enabled
- [ ] Incident response plan documented
- [ ] PII masking implemented
- [ ] DPDP Act 2023 compliance verified

### 12.2 Post-Launch Checklist

- [ ] Security monitoring enabled
- [ ] Alerting configured
- [ ] Regular security audits scheduled
- [ ] Security training completed
- [ ] Incident response drill completed
- [ ] Penetration testing completed
- [ ] Vulnerability scanning scheduled

### 12.3 Ongoing Security Tasks

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

## 13. Security Resources

### 13.1 Official Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [PCI-DSS Requirements](https://www.pcisecuritystandards.org/)
- [DPDP Act 2023](https://dpdpi.gov.in/)

### 13.2 Tools

- [OWASP ZAP](https://www.zaproxy.org/) - Web application security scanner
- [Nessus](https://www.tenable.com/products/nessus) - Vulnerability scanner
- [Nmap](https://nmap.org/) - Network scanner
- [Burp Suite](https://portswigger.net/burp) - Web application security testing

### 13.3 Services

- [Cloudflare WAF](https://www.cloudflare.com/products/waf/) - Web application firewall
- [AWS WAF](https://aws.amazon.com/waf/) - Web application firewall
- [Google Cloud Armor](https://cloud.google.com/armor) - Web application firewall

---

## 14. Conclusion

This Security Best Practices Guide provides a comprehensive framework for maintaining and improving Agra SK Baghel Tour & Travels' security posture. By following these guidelines, the organization can protect user data, maintain business continuity, and comply with regulatory requirements.

**Key Takeaways:**
1. Implement defense in depth with multiple security layers
2. Use least privilege access for all users and systems
3. Secure by default - all security features enabled
4. Regular security audits and monitoring
5. Incident response readiness
6. DPDP Act 2023 compliance as primary focus
7. Zero secret leakage guard in CI/CD

**Next Steps:**
1. Implement all security recommendations
2. Set up security monitoring and alerting
3. Schedule regular security audits
4. Conduct security training for all team members
5. Develop and document incident response plan
