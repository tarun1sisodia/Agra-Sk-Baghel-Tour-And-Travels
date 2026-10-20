# AI Operating Rules — SK Baghel Tour & Travels

This workspace follows the multi-phase monorepo protocol (`react/`, `admin/`, `backend/`)
governed by the root `AGENTS.md` and operational docs.

## Core directives

1. **Work carefully**
   - Never batch unrelated changes into a single reply.
   - For every operation implemented, verify locally and report results before moving on.

2. **Consult single sources of truth**
   - Deployment: `docs/DEPLOYMENT.md` — hosts, build commands, env vars
   - Backend Architecture & Engineering: `BACKEND_RULES.md` — PostgreSQL/Supabase is authoritative
   - Frontend Architecture & Design Standard: `FRONTEND_RULES.md`
   - Visual system: `docs/project/DESIGN.md` — never hardcode arbitrary colors/sizes
   - Locked designs & patterns: `docs/project/DESIGN_LOCKS.md` — verify status before editing any existing component, pattern, or logic
   - Animation verification: `docs/project/ANIMATION_RULES.md` — SEO safety & accessibility before adding animations
   - Payments: `docs/PAYMENT_SYSTEM.md` + `.agents/rules/PAYMENT_AGENT_RULES.md` — never live-charge without signed webhook + server fare
   - Customer PRD: `docs/CUSTOMER_SITE_PRD.md`
   - Admin PRD: `docs/admin/ADMIN_PRD.md`
   - Agent runbook: `docs/agent/01_AGENT_RUNBOOK.md`

3. **Code quality & environment hygiene**
   - No placeholder / partial code
   - Server-authoritative calculations: customer frontend never computes or submits prices or distances
   - Never commit `.env*` secrets, keys, or passwords
   - Work on active branch `main`

4. **Design Lock Compliance**
   - NEVER modify, restyle, refactor, or override any component, design, pattern, or logic listed as `LOCKED` in `docs/project/DESIGN_LOCKS.md` without explicit user permission.
   - If a requested step or change touches a locked component, STOP and ask the user for confirmation first. If not locked, proceed normally.
