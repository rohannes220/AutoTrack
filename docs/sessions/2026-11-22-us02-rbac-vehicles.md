# 2026-11-22 — US-02 RBAC and vehicles

## Goal

Implement the backend for issue #7 (US-02: role-based access and vehicle registration) on
`feature/us02-rbac-vehicles`:

- JWT authentication and role guards.
- Customer login.
- Mechanic vehicle management.
- Customer read-only access to their own vehicles.

It follows the same strict red-green-refactor workflow as US-01, one cycle at a time, stopping after
every commit for review. PR #8.

## Prompts used

1. Plan US-02 in plan mode. Questions asked with their answers:

   | Question | Answer |
   | --- | --- |
   | Issue number? | #7 |
   | Base branch? | Stack on `docs/prd-data-model` (PR #6), then merge `origin/master` for the US-01 code |
   | How much of the customer account belongs here? | Customer model + login only; `POST /api/customers` stays with US-03 |
   | Endpoints not in PRD §8? | Add `GET /api/vehicles` and `GET /api/me/vehicles/:vehicleId`, and record both in PRD §8 |
   | E2E (planned cycle 6)? | Split into a follow-up issue; this branch is backend only |

2. "Go one cycle at a time and stop after each commit." This was followed by "go" or
   "continue with cycle N red" for each step.
3. In cycle 3: put PRD/CLAUDE.md updates in a separate docs commit after the green commit, not
   inside it.
4. "Add the Jest timeout fix as a separate test(config) commit, rerun the tests, and make the cycle
   4 red commit once all new tests fail on their assertions."
5. "Go for the docs commit, skip the refactor." (cycle 4)
6. "Push feature/us02-rbac-vehicles and open a PR into master …", then "add both commits (PRD §8
   row and session log), push, and remove the 'Not yet on this branch' section."

## What changed

| Cycle | Commits | Changes |
| --- | --- | --- |
| Plan | `3ac4f7f` | `docs/plans/us02-rbac-vehicles.md` |
| 1. `requireAuth` | `aa9e4f0` red, `eefa048` green | `middleware/auth.js` `requireAuth`. `utils/jwt.js` `verifyAccessToken`, with the algorithm pinned to HS256. 401 for a missing, non-Bearer, malformed, wrong-secret, or expired token, or one without `sub`/`role` |
| 2. `requireRole` | `1df7bdd` red, `6d1fd63` green | `requireRole(...roles)`: 403 for the wrong role, 401 with no `req.user` |
| 3. Customer login | `6353dde` red, `1143d80` green, `b15370b` docs, `c4d273d` refactor | `models/Customer.js` (no vehicle array). `POST /api/auth/customer/login`. A mechanic's credentials on the customer endpoint get 401. PRD §12 password question resolved. Refactor: shared `authenticate(Model, credentials)` helper |
| — | `49426c1` | `testTimeout: 30000` in `jest.config.js` |
| 4. Mechanic vehicles | `2bdbe12` red, `0434ced` green, `06ecdb3` docs | `models/Vehicle.js` with a unique `{ state, licensePlate }` index. `utils/usStates.js`. Whitelist validation in `utils/validate.js` (`validateVehicleFields`, `isObjectIdString`). `services/vehicleService.js` (409 on a duplicate plate, 400 on an unknown owner, 404 on an unknown id). `POST`/`GET /api/vehicles`, `PATCH /api/vehicles/:vehicleId`, mechanic only. Refactor skipped |
| 5. Customer own vehicles | `0781396` red, `20f7cb6` green, `a861d64` docs | `listCustomerVehicles` and `getCustomerVehicle` in `vehicleService.js`. `controllers/meController.js`. `routes/meRoutes.js` mounted at `/api/me`, customer only. The owner comes only from the verified token. Another customer's vehicle, an unknown id, and a malformed id all return the same `Vehicle not found` 404 |

Test helpers: `fixtures.js` gained `createCustomer`, `customerCredentials`, `createVehicle`
(raw-collection inserts) and `authHeader(user)`.

## Test results

- **Every red step** was checked to fail on assertions, not on import errors. Services were stubbed
  to throw `Not implemented`, and integration tests got the default 404 where they expected other
  statuses.
  - Two tests passed early in red because the missing route's 404 matched what they expected. The
    "customer cannot create a vehicle" check remained a known early pass. The PATCH unknown-id test
    was tightened to assert the exact `Vehicle not found` body, so a missing route's 404 can't pass
    it.
- **Cycle 4 red:** 50 new tests failed, and all 50 existing tests still passed, along with the one
  known early pass.
- **Cycle 4 green:** 101/101 passing.
- **Cycle 5 red:** 15 new tests failed and 101 passed. All 404 expectations assert the exact
  `Vehicle not found` body, so none passed early.
- **Cycle 5 green** (`jest --coverage`):
  - 10 suites, **116/116 passing** in 7.7 s.
  - Coverage on `src/services`: 97.6% statements. `vehicleService.js` is at 96.7%; the uncovered
    line re-throws database errors other than a duplicate key.
- `npm run lint` and `prettier --check --end-of-line auto` are clean.

## Problems

- **Hook timeouts:** each DB suite starts its own `mongodb-memory-server`, and starting them in
  parallel exceeded Jest's 5 s default. This was fixed in its own commit (`49426c1`, 30 s).
- **Disk full:** with 438 MB free, `syncIndexes` failed because MongoDB requires 500 MB. Claude's
  attempt to delete `%TEMP%` mongo-mem folders was denied, and the user freed the space.
- **Slow machine during cycle 5 red:** every DB suite timed out at 30 s, including untouched ones.
  The red state was confirmed by running only the two affected files with `--runInBand`. A later
  full run took 5.7 s, which confirmed the cause was the environment, not the code.
- **Line endings:** `core.autocrlf=true` together with Prettier's LF default means
  `prettier --write backend/src` rewrote line endings on untouched files. Those files were restored
  with `git checkout --` and never committed. A `.gitattributes` with `* text=auto eol=lf` is a
  follow-up.
- **Bash heredocs:** large multi-heredoc commands failed to parse in Git Bash on Windows. New files
  were written with the Write tool instead.
- **`/api/me` guard scope:** the customer guard covers everything under `/api/me`, so an unknown
  path such as `/api/me/foo` returns 401 or 403 instead of 404.

## Follow-ups

- E2E tests and the customer frontend pages: customer login and My Vehicles, with a Playwright spec.
- `POST /api/customers` (US-03).
- `.gitattributes` to force LF line endings.
- `Mechanic.assignedRepairs` is a reference array, which contradicts PRD §7 ("Customer and
  Mechanic do not store reference arrays"). This branch leaves it unchanged.
- Still open from US-01: the timing difference between unknown-email and wrong-password logins.
  `authenticate` could compare against a dummy hash when no user is found.
