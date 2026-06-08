# Task 6: Migrate GET Handlers to HTTP-Based Neon SQL Client

**Agent:** DB Connection Pool Migration Agent
**Task ID:** 6
**Date:** 2025-03-05

## Summary
Migrated all 21 fleet API route GET handlers from Prisma (`db`) to HTTP-based neon SQL client (`sql`) to eliminate Neon PostgreSQL free tier connection pool exhaustion. Write operations (POST/PUT/DELETE) continue using Prisma.

## Files Modified

### Read-only routes (sql only)
1. `src/app/api/fleet/dashboard/route.ts` — GET: 4 parallel sql queries with JOINs
2. `src/app/api/fleet/reports/route.ts` — GET: 3 parallel sql queries

### Read+Write routes (sql for GET, db for writes)
3. `src/app/api/fleet/vehicles/route.ts`
4. `src/app/api/fleet/customers/route.ts`
5. `src/app/api/fleet/drivers/route.ts`
6. `src/app/api/fleet/reservations/route.ts`
7. `src/app/api/fleet/revenue/route.ts`
8. `src/app/api/fleet/clients/route.ts`
9. `src/app/api/fleet/maintenance/route.ts`
10. `src/app/api/fleet/fuel/route.ts`
11. `src/app/api/fleet/tenants/route.ts`
12. `src/app/api/fleet/subscriptions/route.ts`
13. `src/app/api/fleet/licenses/route.ts`
14. `src/app/api/fleet/devices/route.ts`
15. `src/app/api/fleet/dispatch/route.ts`
16. `src/app/api/fleet/rentals/route.ts`
17. `src/app/api/fleet/inspections/route.ts`
18. `src/app/api/fleet/trips/route.ts`
19. `src/app/api/fleet/workshop/route.ts`
20. `src/app/api/fleet/parts/route.ts`
21. `src/app/api/fleet/finance/expenses/route.ts`

### Files NOT modified (kept using db only)
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/demo/route.ts`
- `src/app/api/auth/seed/route.ts`

## Technical Patterns

- **Static queries:** `sql\`SELECT ... FROM "Table"\``
- **Dynamic queries:** `sql.query('SELECT ... WHERE col = $1', [value])`
- **Nested relations:** `row_to_json(related.*) as relationName`
- **One-to-many:** `COALESCE((SELECT json_agg(...) FROM ...), '[]'::json) as items`

## Verification
- ESLint passes
- No TypeScript errors in fleet routes
- Response shapes preserved for frontend compatibility
