# Main branch verification — d886aafc4182

- **Result:** FAIL
- **Commit:** [d886aafc4182bb04c5301c29b6b3ae1276ce44ce](https://github.com/tarun1sisodia/ArenaAI/commit/d886aafc4182bb04c5301c29b6b3ae1276ce44ce)
- **Checked at:** 2026-10-16T19:49:54Z
- **Workflow run:** [38957694101](https://github.com/tarun1sisodia/ArenaAI/actions/runs/38957694101)

## Changed files

- M	admin/src/components/admin/AdminLayout.tsx
- M	admin/src/components/admin/Sidebar.tsx
- M	admin/src/lib/api.ts
- M	admin/src/modules/tour-packages/TourPackageGalleryUploader.tsx
- M	admin/src/modules/tour-packages/TourPackageList.tsx
- M	admin/src/modules/tour-packages/tour-packages.constants.ts
- M	admin/src/pages/TourPackagesPage.tsx
- M	backend/src/modules/tour-packages/tour-packages.service.ts

## Verification command

```text
npm run install:all && npm run verify
```

## Verification result

```text

> sk-baghel-tour-travels@0.1.0 verify
> npm run contracts:check && npm run customer:typecheck && npm run admin:typecheck && npm run backend:typecheck && npm run customer:validate-config && npm test && npm run customer:seo && npm run build:all


> sk-baghel-tour-travels@0.1.0 contracts:check
> node --experimental-strip-types contracts/scripts/sync-contracts.ts --check


> sk-baghel-tour-travels@0.1.0 customer:typecheck
> npm --prefix react run typecheck


> skb-react@0.1.0 typecheck
> tsc --noEmit


> sk-baghel-tour-travels@0.1.0 admin:typecheck
> npm --prefix admin run typecheck


> skb-admin@0.1.0 typecheck
> tsc --noEmit


> sk-baghel-tour-travels@0.1.0 backend:typecheck
> npm --prefix backend run typecheck


> @sk-baghel/backend@0.1.0 typecheck
> tsc -p tsconfig.json --noEmit

tests/unit/publication-worker.test.ts(1207,12): error TS2532: Object is possibly 'undefined'.
tests/unit/publication-worker.test.ts(1208,12): error TS2532: Object is possibly 'undefined'.
tests/unit/publication-worker.test.ts(1209,12): error TS2532: Object is possibly 'undefined'.
tests/unit/publication-worker.test.ts(1210,12): error TS2532: Object is possibly 'undefined'.
```
