# Agent Runbook — Agra SK Baghel Tour & Travels

## 1. Session Start Checklist

**Before writing ANY code, read these files in order:**

1. [`docs/AGENT_GUIDE.md`](docs/AGENT_GUIDE.md) - Documentation structure and rules
2. [`docs/PLATFORM_ARCHITECTURE.md`](docs/PLATFORM_ARCHITECTURE.md) - Complete platform specification
3. [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) - Deployment instructions
4. [`BACKEND_RULES.md`](BACKEND_RULES.md) - Backend development rules
5. [`FRONTEND_RULES.md`](FRONTEND_RULES.md) - Frontend development rules

**DO NOT proceed until you've read all files above.**

---

## 2. Platform Architecture Rules

### 2.1 Single Source of Truth

| Component | Source |
|-----------|--------|
| **Platform Specification** | `docs/PLATFORM_ARCHITECTURE.md` |
| **Deployment** | `docs/DEPLOYMENT.md` |
| **Backend Rules** | `BACKEND_RULES.md` |
| **Frontend Rules** | `FRONTEND_RULES.md` |
| **Payment System** | `docs/PAYMENT_SYSTEM.md` |

### 2.2 Core Principles

1. **Database is the single source of truth**
   - All business data in PostgreSQL
   - No dual-write patterns
   - No MongoDB or other databases

2. **Server-authoritative pricing**
   - Client NEVER determines prices
   - All fare calculations server-side
   - Client only displays prices from backend

3. **Database-driven publishing**
   - Admin creates content → Database stores draft
   - Validation → Publication → Public website updates
   - NO developer involvement for content updates

4. **Shared contracts**
   - All contracts in `contracts/` directory
   - Generated copies in `backend/src/contracts/`, `admin/src/contracts/`, `react/src/contracts/`
   - NEVER edit generated copies directly
   - Regenerate with: `npx tsx contracts/scripts/sync-contracts.ts`

5. **Role-based access control**
   - Two roles only: `super_admin` and `developer`
   - Permissions checked on every API call
   - Backend RBAC (not just frontend hiding)

---

## 3. Development Workflow

### 3.1 Feature Development

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Feature Development Workflow                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Read PLATFORM_ARCHITECTURE.md (canonical spec)                  │
│  2. Identify feature in development phases (0-12)                   │
│  3. Design database schema if new tables needed                     │
│  4. Create migration file in backend/migrations/                    │
│  5. Update contracts in contracts/ directory                        │
│  6. Regenerate contracts: npx tsx contracts/scripts/sync-contracts.ts│
│  7. Implement backend API endpoints                                 │
│  8. Implement frontend components                                   │
│  9. Run verification: npm run verify                                │
│  10. Deploy following DEPLOYMENT.md                                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Verification Checklist

**Before marking any task complete, ALWAYS run:**

```bash
npm run verify
```

This runs:
- `contracts:check` — Contract sync verification
- `customer:typecheck` — React typecheck
- `admin:typecheck` — Admin typecheck
- `backend:typecheck` — Backend typecheck
- `customer:validate-config` — Config validation
- `test` — Backend unit tests + catalog validation
- `customer:seo` — SEO artifact validation
- `build:all` — Production builds (x3)

---

## 4. Common Mistakes to Avoid

### 4.1 DO NOT

| Mistake | Correct Approach |
|---------|------------------|
| Edit generated contract copies directly | Edit `contracts/*.ts` and regenerate |
| Store secrets in frontend bundles | Environment variables only in backend |
| Allow client-side fare manipulation | All pricing calculated server-side |
| Create new database tables without migration | Always create migration files in `backend/migrations/` |
| Deploy without verification | Always run `npm run verify` before deployment |
| Reference deprecated documentation | Always reference `PLATFORM_ARCHITECTURE.md` first |

### 4.2 DO

| Action | How |
|--------|-----|
| Reference platform spec | Read `docs/PLATFORM_ARCHITECTURE.md` first |
| Use shared contracts | Prevents deduplication and mismatch |
| Follow database-driven publishing | No developer involvement for content updates |
| Run verification before completion | Catch issues early |
| Use PostgreSQL as single source of truth | No dual-write patterns |

---

## 5. Development Phases

The platform is developed in **13 phases** (0-12). Always reference the current phase:

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 0 | Repository Forensic Audit | ✅ Complete | Architecture and historical findings |
| 1 | Product Requirements | ✅ Complete | Every domain and workflow specified |
| 2 | System Architecture | ✅ Complete | Approved components and data flows |
| 3 | Database Design | ✅ Complete | ERD, constraints, migrations |
| 4 | Contracts and APIs | ✅ Complete | Shared schemas and API specifications |
| 5 | Authentication and Security | ✅ Complete | RBAC, RLS, audit, threat testing |
| 6 | Admin Platform | ✅ Complete | Working management modules |
| 7 | Customer Platform | ✅ Complete | Complete responsive customer experience |
| 8 | Publishing Infrastructure | ✅ Complete | Reliable content-to-website sync |
| 9 | SEO Infrastructure | ✅ Complete | Automated SEO validation |
| 10 | Integrations | ✅ Complete | Payments, email, media, notifications |
| 11 | QA and Security | ✅ Complete | Functional, integration, performance, security testing |
| 12 | Production Release | ✅ Complete | Migration, deployment, monitoring, rollback |

---

## 6. Key Files Reference

### 6.1 Source Files

| File | Purpose |
|------|---------|
| `contracts/index.ts` | Canonical contract exports |
| `backend/src/app.ts` | Fastify factory |
| `backend/src/server.ts` | Backend entry point |
| `react/src/main.tsx` | Customer frontend entry point |
| `admin/src/main.tsx` | Admin frontend entry point |

### 6.2 Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Root workspace config |
| `backend/.env.example` | Backend environment variables |
| `react/.env.example` | Customer frontend environment variables |
| `admin/.env.example` | Admin frontend environment variables |

---

## 7. Support

For questions or issues:
1. Check `docs/PLATFORM_ARCHITECTURE.md` first
2. Check `docs/DEPLOYMENT.md` for deployment issues
3. Check `BACKEND_RULES.md` / `FRONTEND_RULES.md` for coding standards
4. Review the agent guide in `docs/AGENT_GUIDE.md`

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-10-31  
**Author:** Agra SK Baghel Tour & Travels Engineering Team
