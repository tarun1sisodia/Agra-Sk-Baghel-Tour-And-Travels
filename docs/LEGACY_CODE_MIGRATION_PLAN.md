# Legacy Code Migration Plan

## Current Architecture

The system currently uses a **dual-system (bridge) pattern** where both legacy and clean fare implementations coexist:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Fastify Application                           │
├─────────────────────────────────────────────────────────────────────┤
│  Legacy Routes (always mounted)                                     │
│  ├─ /api/v1/fares/*                                                 │
│  ├─ /api/v1/locations/*                                             │
│  ├─ /api/v1/bookings/*                                              │
│  ├─ /api/v1/payments/*                                              │
│  ├─ /api/v1/catalog/*                                               │
│  ├─ /api/v1/reviews/*                                               │
│  ├─ /api/v1/routes/*                                                │
│  ├─ /api/v1/tour-packages/*                                         │
│  ├─ /api/v1/transfer-routes/*                                       │
│  ├─ /api/v1/local-packages/*                                        │
│  ├─ /api/v1/cancellation-policies/*                                 │
│  ├─ /api/v1/monuments/*                                             │
│  ├─ /api/v1/pet-policy/*                                            │
│  ├─ /api/v1/company-profile/*                                       │
│  ├─ /api/v1/dossier-signoffs/*                                      │
│  ├─ /api/v1/content/*                                               │
│  ├─ /api/v1/inquiries/*                                             │
│  ├─ /api/v1/rental-enquiries/*                                      │
│  ├─ /api/v1/promos/*                                                │
│  └─ /admin/*                                                        │
│                                                                      │
│  Clean Fare System (conditional mount - when farePool available)    │
│  ├─ /api/v1/quotes/*                                                │
│  ├─ /api/v1/fare-catalog/*                                          │
│  ├─ /api/v1/bookings/* (new implementation)                         │
│  ├─ /api/v1/payments/* (new implementation)                         │
│  └─ /api/v1/fare-admin/*                                            │
└─────────────────────────────────────────────────────────────────────┘
```

## Migration Phases

### Phase 6.1: Audit & Inventory (Current)

**Goal:** Identify all legacy code that needs to be removed

**Tasks:**
1. [ ] Audit all legacy controller files in `backend/src/modules/`
2. [ ] Audit all legacy route files in `backend/src/modules/*/routes.ts`
3. [ ] Audit all legacy service files in `backend/src/modules/*/service.ts`
4. [ ] Audit all legacy repository files in `backend/src/modules/*/repository.ts`
5. [ ] Create a mapping of legacy vs clean implementations
6. [ ] Identify dependencies between legacy and clean code

**Deliverable:** `docs/LEGACY_CODE_INVENTORY.md`

---

### Phase 6.2: Test Coverage Audit

**Goal:** Ensure all legacy functionality has equivalent test coverage in clean fare system

**Tasks:**
1. [ ] Run test coverage report on legacy code
2. [ ] Run test coverage report on clean fare system
3. [ ] Identify gaps in clean fare system test coverage
4. [ ] Add missing tests for clean fare system
5. [ ] Verify all 360 tests pass with clean fare system only

**Deliverable:** Test coverage report showing 100% parity

---

### Phase 6.3: Database Migration

**Goal:** Migrate all data from legacy database schema to clean fare schema

**Tasks:**
1. [ ] Create database migration scripts
2. [ ] Test migrations on staging environment
3. [ ] Deploy migrations to production
4. [ ] Verify data integrity after migration
5. [ ] Update all queries to use clean fare schema

**Deliverable:** Database migration completed, all data migrated

---

### Phase 6.4: Route Migration

**Goal:** Switch all routes from legacy to clean fare implementation

**Tasks:**
1. [ ] Update frontend to use clean fare API endpoints
2. [ ] Update admin panel to use clean fare API endpoints
3. [ ] Update mobile apps to use clean fare API endpoints
4. [ ] Add deprecation headers to legacy routes
5. [ ] Monitor legacy route usage
6. [ ] Remove legacy routes after 30 days of zero usage

**Deliverable:** All routes migrated to clean fare system

---

### Phase 6.5: Code Removal

**Goal:** Remove all legacy code files

**Tasks:**
1. [ ] Delete legacy controller files
2. [ ] Delete legacy route files
3. [ ] Delete legacy service files
4. [ ] Delete legacy repository files
5. [ ] Update imports in `backend/src/app.ts`
6. [ ] Update `backend/src/db/types.ts` to remove legacy types
7. [ ] Update `backend/src/db/memory.ts` to remove legacy implementations

**Deliverable:** Legacy code completely removed

---

### Phase 6.6: Final Verification

**Goal:** Verify system works correctly without legacy code

**Tasks:**
1. [ ] Run full test suite (360 tests)
2. [ ] Run integration tests
3. [ ] Run performance tests
4. [ ] Run security audit
5. [ ] Deploy to staging
6. [ ] Deploy to production

**Deliverable:** System verified working without legacy code

---

## Risk Mitigation

### Rollback Plan
- Keep legacy code in a separate branch until Phase 6.6 is complete
- Maintain database migration scripts for easy rollback
- Keep legacy routes as a fallback option

### Monitoring
- Add metrics for legacy route usage
- Monitor error rates after migration
- Set up alerts for any issues

### Testing Strategy
- Run parallel tests on both systems during migration
- Use feature flags to toggle between legacy and clean fare
- Gradual rollout with canary deployments

---

## Success Criteria

1. **All 360 tests pass** with clean fare system only
2. **Zero legacy route usage** for 30+ days
3. **No production incidents** after legacy code removal
4. **Test coverage parity** between legacy and clean fare
5. **Performance improvement** of at least 10% after migration

---

## Timeline Estimate

| Phase | Estimated Duration |
|-------|-------------------|
| 6.1 Audit & Inventory | 2-3 days |
| 6.2 Test Coverage Audit | 3-5 days |
| 6.3 Database Migration | 5-7 days |
| 6.4 Route Migration | 7-10 days |
| 6.5 Code Removal | 2-3 days |
| 6.6 Final Verification | 3-5 days |
| **Total** | **22-33 days** |

---

## Notes

- This plan assumes the clean fare system is already functional
- Some legacy code may need to be kept for backward compatibility
- Consider keeping legacy code in a `legacy/` directory for reference
- Document all changes in `docs/CHANGELOG.md`
