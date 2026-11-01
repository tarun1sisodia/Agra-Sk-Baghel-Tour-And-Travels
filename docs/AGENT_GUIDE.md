# Agent Guide — SK Baghel Tour & Travels Documentation

## 1. Documentation Structure

This repository uses a **single source of truth** approach for documentation. The `PLATFORM_ARCHITECTURE.md` file is the **canonical reference** for all platform specifications.

### Documentation Hierarchy

| File | Status | Purpose |
|------|--------|---------|
| **`docs/PLATFORM_ARCHITECTURE.md`** | **CANONICAL** | Complete platform specification (customer, admin, backend, database) |
| `docs/DEPLOYMENT.md` | Reference | Deployment instructions and CI/CD workflow |
| `docs/PAYMENT_SYSTEM.md` | Reference | Payment integration and webhook handling |
| `docs/CUSTOMER_SITE_PRD.md` | Reference | Customer site product requirements |
| `docs/admin/ADMIN_PRD.md` | Reference | Admin operations desk requirements |
| `docs/agent/01_AGENT_RUNBOOK.md` | Reference | Agent workflow and runbook |

## 2. Agent Workflow

### 2.1 First Session - Read These Files

When starting work on this repository, **always** read these files in order:

1. **`docs/AGENT_GUIDE.md`** - This file (documentation structure)
2. **`docs/PLATFORM_ARCHITECTURE.md`** - Complete platform specification
3. **`docs/DEPLOYMENT.md`** - Deployment instructions
4. **`BACKEND_RULES.md`** - Backend development rules
5. **`FRONTEND_RULES.md`** - Frontend development rules

### 2.2 Development Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Agent Development Workflow                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Read PLATFORM_ARCHITECTURE.md (canonical spec)                  │
│  2. Read DEPLOYMENT.md (deployment workflow)                        │
│  3. Read BACKEND_RULES.md / FRONTEND_RULES.md (coding standards)    │
│  4. Implement feature following platform spec                       │
│  5. Run verification: npm run verify                                │
│  6. Deploy following DEPLOYMENT.md                                  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Platform Architecture Rules

**ALWAYS follow these rules:**

1. **Database is the single source of truth**
   - All business data stored in PostgreSQL
   - No dual-write patterns
   - No MongoDB or other databases

2. **Server-authoritative pricing**
   - Client NEVER determines prices
   - All fare calculations done server-side
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

## 3. Development Phases

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

## 4. Verification Checklist

Before marking any task complete, **always** run:

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

## 5. Key Files Reference

### Source Files

| File | Purpose |
|------|---------|
| `contracts/index.ts` | Canonical contract exports |
| `backend/src/app.ts` | Fastify factory |
| `backend/src/server.ts` | Backend entry point |
| `react/src/main.tsx` | Customer frontend entry point |
| `admin/src/main.tsx` | Admin frontend entry point |

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Root workspace config |
| `backend/.env.example` | Backend environment variables |
| `react/.env.example` | Customer frontend environment variables |
| `admin/.env.example` | Admin frontend environment variables |

## 6. Common Mistakes to Avoid

### ❌ DO NOT

1. **Edit generated contract copies directly**
   - Always edit `contracts/*.ts` and regenerate

2. **Store secrets in frontend bundles**
   - Environment variables only in backend

3. **Allow client-side fare manipulation**
   - All pricing calculated server-side

4. **Create new database tables without migration**
   - Always create migration files in `backend/migrations/`

5. **Deploy without verification**
   - Always run `npm run verify` before deployment

### ✅ DO

1. **Reference PLATFORM_ARCHITECTURE.md first**
   - It's the single source of truth

2. **Use shared contracts**
   - Prevents deduplication and mismatch

3. **Follow database-driven publishing**
   - No developer involvement for content updates

4. **Run verification before completion**
   - Catch issues early

5. **Use PostgreSQL as single source of truth**
   - No dual-write patterns

## 7. Support

For questions or issues:
1. Check `docs/PLATFORM_ARCHITECTURE.md` first
2. Check `docs/DEPLOYMENT.md` for deployment issues
3. Check `BACKEND_RULES.md` / `FRONTEND_RULES.md` for coding standards
4. Review the agent runbook in `docs/agent/01_AGENT_RUNBOOK.md`

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-10-31  
**Author:** SK Baghel Tour & Travels Engineering Team