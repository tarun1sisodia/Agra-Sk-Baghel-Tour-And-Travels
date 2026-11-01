# Documentation Index — Agra SK Baghel Tour & Travels

This directory contains comprehensive documentation for the Agra SK Baghel Tour & Travels platform. Use this index to find the right document for your task.

---

## 📚 Documentation Index

### Core Platform Documentation

| File | Purpose | When to Read |
|------|---------|--------------|
| **[`PLATFORM_ARCHITECTURE.md`](PLATFORM_ARCHITECTURE.md)** | Complete platform specification (customer, admin, backend, database) | **START HERE** - For any new feature or major change |
| [`PROJECT_ARCHITECTURE.md`](PROJECT_ARCHITECTURE.md) | Project overview, technology stack, monorepo structure | For understanding the overall project structure |
| [`BACKEND_ARCHITECTURE.md`](BACKEND_ARCHITECTURE.md) | Backend API design, Fastify, repositories, business logic | For backend development |
| [`FRONTEND_ARCHITECTURE.md`](FRONTEND_ARCHITECTURE.md) | Frontend architecture, React, Vite, component structure | For frontend development |
| [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) | PostgreSQL schema, tables, relationships, migrations | For database work and migrations |

### Deployment & Operations

| File | Purpose | When to Read |
|------|---------|--------------|
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Deployment instructions, CI/CD workflow, environment setup | For deployment tasks |
| [`DEPLOYMENT_AND_CICD.md`](DEPLOYMENT_AND_CICD.md) | CI/CD pipeline details, GitHub Actions workflows | For CI/CD configuration |

### Development Standards

| File | Purpose | When to Read |
|------|---------|--------------|
| [`BACKEND_RULES.md`](../BACKEND_RULES.md) | Backend development rules, API conventions, error handling | Before writing backend code |
| [`FRONTEND_RULES.md`](../FRONTEND_RULES.md) | Frontend development rules, component patterns, styling | Before writing frontend code |
| [`PAYMENT_SYSTEM.md`](PAYMENT_SYSTEM.md) | Payment integration, Razorpay, webhooks, refunds | For payment-related work |
| [`PAYMENT_SECURITY.md`](PAYMENT_SECURITY.md) | Payment security best practices, fraud prevention | For security-sensitive payment work |

### Testing & Quality

| File | Purpose | When to Read |
|------|---------|--------------|
| [`TESTING_STRATEGY.md`](TESTING_STRATEGY.md) | Testing approach, unit tests, integration tests, E2E | For writing tests |
| [`SECURITY_BEST_PRACTICES.md`](SECURITY_BEST_PRACTICES.md) | Security guidelines, authentication, authorization, data protection | For security-related work |

### SEO & Performance

| File | Purpose | When to Read |
|------|---------|--------------|
| [`SEO_ENGINE.md`](SEO_ENGINE.md) | SEO engine architecture, metadata management, sitemap, validation | For SEO-related work |
| [`SEO_AND_PERFORMANCE_OPTIMIZATION.md`](SEO_AND_PERFORMANCE_OPTIMIZATION.md) | SEO best practices, Core Web Vitals, performance targets | For performance optimization |

### Platform-Specific Documentation

| File | Purpose | When to Read |
|------|---------|--------------|
| [`RBAC.md`](RBAC.md) | Role-based access control, permissions, super_admin/developer roles | For permission-related work |
| [`PUBLISHING_INFRASTRUCTURE.md`](PUBLISHING_INFRASTRUCTURE.md) | Publishing workflow, outbox pattern, validation, cache sync | For content publishing work |
| [`CUSTOMER_SITE_PRD.md`](CUSTOMER_SITE_PRD.md) | Customer site product requirements, user flows | For customer-facing features |
| [`admin/ADMIN_PRD.md`](admin/ADMIN_PRD.md) | Admin operations desk requirements, admin modules | For admin panel features |

### Agent & Development Workflow

| File | Purpose | When to Read |
|------|---------|--------------|
| [`AGENT_GUIDE.md`](AGENT_GUIDE.md) | Agent documentation structure and workflow | For agents starting work |
| [`agent/01_AGENT_RUNBOOK.md`](agent/01_AGENT_RUNBOOK.md) | Agent session checklist and development phases | For agent session start |

---

## 🎯 Quick Reference by Task

### Starting a New Feature
1. Read [`PLATFORM_ARCHITECTURE.md`](PLATFORM_ARCHITECTURE.md) - Understand the platform spec
2. Read [`BACKEND_RULES.md`](../BACKEND_RULES.md) or [`FRONTEND_RULES.md`](../FRONTEND_RULES.md) - Coding standards
3. Check [`DEPLOYMENT.md`](DEPLOYMENT.md) - Deployment process

### Database Work
1. Read [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) - Understand the schema
2. Read [`DEPLOYMENT.md`](DEPLOYMENT.md) - Migration deployment
3. Read [`BACKEND_RULES.md`](../BACKEND_RULES.md) - Repository patterns

### Backend Development
1. Read [`BACKEND_ARCHITECTURE.md`](BACKEND_ARCHITECTURE.md) - Backend structure
2. Read [`BACKEND_RULES.md`](../BACKEND_RULES.md) - Coding standards
3. Read [`PAYMENT_SYSTEM.md`](PAYMENT_SYSTEM.md) - If working with payments

### Frontend Development
1. Read [`FRONTEND_ARCHITECTURE.md`](FRONTEND_ARCHITECTURE.md) - Frontend structure
2. Read [`FRONTEND_RULES.md`](../FRONTEND_RULES.md) - Coding standards
3. Read [`SEO_ENGINE.md`](SEO_ENGINE.md) - If working with SEO features

### Deployment
1. Read [`DEPLOYMENT.md`](DEPLOYMENT.md) - Deployment instructions
2. Read [`DEPLOYMENT_AND_CICD.md`](DEPLOYMENT_AND_CICD.md) - CI/CD details
3. Read [`SECURITY_BEST_PRACTICES.md`](SECURITY_BEST_PRACTICES.md) - Security checklist

### Testing
1. Read [`TESTING_STRATEGY.md`](TESTING_STRATEGY.md) - Testing approach
2. Read [`SECURITY_BEST_PRACTICES.md`](SECURITY_BEST_PRACTICES.md) - Security testing

### SEO Work
1. Read [`SEO_ENGINE.md`](SEO_ENGINE.md) - SEO engine architecture
2. Read [`SEO_AND_PERFORMANCE_OPTIMIZATION.md`](SEO_AND_PERFORMANCE_OPTIMIZATION.md) - SEO best practices

---

## 📝 Document Maintenance

### When to Create New Documentation
- New major feature with complex architecture
- New database schema changes
- New API endpoints or patterns
- New deployment workflows

### When to Update Existing Documentation
- Minor feature additions (update relevant section)
- Bug fixes that change behavior
- Performance improvements

### Document Versioning
- Major changes: Increment major version (e.g., 1.0.0 → 2.0.0)
- Minor changes: Increment minor version (e.g., 1.0.0 → 1.1.0)
- Patch changes: Increment patch version (e.g., 1.0.0 → 1.0.1)

---

## 🔗 Related Resources

- [Project README](../README.md) - Project overview
- [Contract Registry](../contracts/REGISTRY.md) - Contract specifications
- [Contract Wireframe](../contracts/WIRE.md) - Contract design notes

---

**Last Updated:** 2026-10-31  
**Maintained By:** Agra SK Baghel Tour & Travels Engineering Team