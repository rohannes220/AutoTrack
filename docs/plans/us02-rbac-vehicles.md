# US-02 RBAC + vehicles (#7): plan

## Context
Issue #7, "US-02: Role-based access and vehicle registration". This branch adds the first protected endpoints. It needs JWT auth and role guards, a Customer account that can log in, mechanic vehicle management, and customer read-only access to their own vehicles. The workflow matches PR #5: a plan commit, then red → green → (optional) refactor for each cycle, then a session log. **I stop after every commit for your review.**

### Decisions (from your answers)
- Issue number is **#7**. Every commit message ends with `(#7)`.
- **Base:** stack on `docs/prd-data-model` (PR #6). That branch forks from `285f45f`, before PR #5 merged, so it **doesn't have the US-01 auth code** (`authService`, `utils/jwt.js`, fixtures). Step 0 merges `origin/master` into the new feature branch. PR #6's own branch stays untouched. Git should merge cleanly because master didn't touch `docs/PRD.md` or `CLAUDE.md` after that fork.
- **Customer account:** model + customer login only. Tests create customers with fixtures, and `POST /api/customers` stays with US-03. PRD §12 records the answer: the mechanic sets a temporary password, which is stored as a bcrypt hash, with no forced change.
- **Endpoints beyond PRD §8:** add `GET /api/vehicles` (mechanic list) and `GET /api/me/vehicles/:vehicleId` (customer, 404 if it isn't theirs). Both get rows in the PRD §8 table on this branch.
- **E2E (cycle 6) moves to a follow-up issue/branch**, with the customer login and My Vehicles pages. This branch is backend only.

## Reuse (on master)
- `backend/src/utils/jwt.js` `signAccessToken({ sub, role })`: add `verifyAccessToken` next to it.
- `backend/src/utils/AppError.js`, `middleware/errorHandler.js` (`{ error: { message } }` shape).
- `backend/src/utils/validate.js` `requireStrings`: extend it with vehicle field validation.
- `backend/src/services/authService.js` `loginMechanic`: the template for `loginCustomer`.
- `backend/tests/helpers/testDb.js`, `fixtures.js` (`createMechanic` inserts raw docs), `tests/integration/mechanicLogin.test.js` (test style).
- `config/db.js` `sanitizeFilter` (operator-injection guard, already active in tests).

## Step 0: branch + plan commit
1. `git checkout -b feature/us02-rbac-vehicles docs/prd-data-model`, then `git merge origin/master`.
2. Copy this plan to `docs/plans/us02-rbac-vehicles.md` and commit `docs(plan): plan US-02 RBAC and vehicles (#7)`. **Stop.**

## Cycle 1: `requireAuth` → 401
- **Red** `test(auth): red - add failing tests for requireAuth middleware (#7)`. `tests/unit/requireAuth.test.js` calls the middleware with mock req/res/next:
  - A valid Bearer token calls `next()` with no error and sets `req.user = { id, role }`.
  - Each of these is 401 `AppError`: missing header, a non-Bearer scheme, `Bearer` with no token, a malformed token, the wrong secret, an expired token, a token with no `sub`/`role`.
- **Green** `feat(auth): green - implement requireAuth middleware (#7)`: `middleware/auth.js` exports `requireAuth`, and `utils/jwt.js` gains `verifyAccessToken` (it pins `algorithms: ['HS256']`).
- **Refactor** only if something is worth cleaning up.

## Cycle 2: `requireRole` → 403
- **Red** `test(auth): red - add failing tests for requireRole (#7)`. `tests/unit/requireRole.test.js`:
  - A matching role goes to `next()`.
  - A customer on `requireRole('mechanic')` gets 403.
  - No `req.user` gets 401 (defensive).
  - It accepts several roles.
- **Green** `feat(auth): green - implement requireRole middleware (#7)`: `requireRole(...roles)` in `middleware/auth.js`.

## Cycle 3: Customer model + customer login
- **Red** `test(auth): red - add failing tests for customer login (#7)`:
  - `fixtures.js` gains `customerCredentials` and `createCustomer()`, which inserts raw docs like `createMechanic`.
  - `tests/integration/customerLogin.test.js` mirrors the mechanic login tests: 200 with `{ token, customer: { id, name } }`, no hash leak, the same 401 for a wrong password and an unknown email, 400 for bad fields or a `$ne` injection, and 401 when **a mechanic's credentials are used on the customer endpoint** (role separation).
  - Unit tests in `authService.test.js` check that `loginCustomer`'s token has `role: 'customer'`.
- **Green** `feat(auth): green - implement customer login (#7)`:
  - `models/Customer.js` has `name`, `email` (unique, lowercase, trimmed; the login and contact email), `phone` (optional contact), `passwordHash` (`select: false`), and `role: 'customer'` (immutable). It has no vehicle array.
  - `loginCustomer` goes in `authService.js`, `customerLogin` in `authController.js`, and the route is `POST /api/auth/customer/login`.
  - PRD §12 moves the password question to resolved ("mechanic sets a temporary password at account creation; stored as a bcrypt hash; no forced change"). The CLAUDE.md "Open Questions" sentence gets the same update.
- **Refactor** `refactor(auth): refactor - share credential check between login flows (#7)`: one private helper `authenticate(Model, credentials)`.

## Cycle 4: mechanic vehicles (create / list / update)
- **Red** `test(vehicles): red - add failing tests for mechanic vehicle management (#7)`:
  - `fixtures.js` gains `createVehicle()` and `authHeader(user)`, which signs with `signAccessToken`.
  - `tests/integration/vehicles.test.js`, with `await Vehicle.init()` so the unique index exists:
    - `POST /api/vehicles` returns 201. The plate is normalized to uppercase and the owner is linked.
    - The same state + plate is 409. The same plate in a different state is 201.
    - A missing or invalid field (year out of range, bad state code, non-string, a `$` key) is 400. An unknown owner is 400. A malformed id is 400.
    - `GET /api/vehicles` lists all vehicles.
    - `PATCH /api/vehicles/:id` updates whitelisted fields and can re-link the owner. Ignored or unknown fields are rejected with 400. An unknown id is 404. A PATCH that creates a duplicate plate is 409.
    - No token on any route is 401, and a customer token is 403.
  - Unit tests in `tests/unit/vehicleService.test.js` cover the service, for ≥80% coverage.
- **Green** `feat(vehicles): green - implement mechanic vehicle create, list, update (#7)`:
  - `models/Vehicle.js` has `make`, `model`, `year` (integer, 1886 to next year), `color`, `state` (enum of US state codes + DC, uppercase), `licensePlate` (uppercase, trimmed), and `owner` (a required Customer ref). It has a unique index on `{ state: 1, licensePlate: 1 }`.
  - `services/vehicleService.js` maps a duplicate-key error (code 11000) to a 409 `AppError` and checks that the owner exists.
  - The validation helper goes in `utils/validate.js`. Also `controllers/vehicleController.js` and `routes/vehicleRoutes.js`, with `router.use(requireAuth, requireRole('mechanic'))` mounted at `/api/vehicles`.
  - PRD §8 gets a `GET /api/vehicles` row.
- **Refactor** if needed, for example a shared `parseObjectId` helper.

## Cycle 5: customer own vehicles
- **Red** `test(vehicles): red - add failing tests for customer own-vehicle access (#7)`. `tests/integration/meVehicles.test.js` has two customers, each with vehicles:
  - `GET /api/me/vehicles` returns only the caller's vehicles. A `?owner=<other id>` query is ignored.
  - `GET /api/me/vehicles/:id` returns the caller's own vehicle. **Another customer's vehicle is 404**, and so are an unknown or malformed id. None of these responses contain the other customer's data.
  - A mechanic token is 403 and no token is 401.
- **Green** `feat(vehicles): green - implement customer own-vehicle endpoints (#7)`:
  - `routes/meRoutes.js` is mounted at `/api/me` with `requireAuth, requireRole('customer')`.
  - The service filters on `owner: req.user.id` only.
  - PRD §8 gets the `GET /api/me/vehicles/:vehicleId` row.

## Wrap-up
- Session log `docs/sessions/2026-11-22-us02-rbac-vehicles.md` (goal, prompts, changes, test results, problems), committed as `docs(sessions): log US-02 RBAC and vehicles session (#7)`.
- I only open a PR if you ask. When I do, it says it's stacked on #6, includes `Closes #7`, and has an AI-assistance note.
- Follow-ups to file: E2E + customer frontend pages (old cycle 6); `POST /api/customers` (US-03). Also, `Mechanic.assignedRepairs` contradicts PR #6's "no reference arrays" rule. I won't touch it on this branch.

## Verification (each green/refactor commit)
- `npm run test:backend`: the new tests fail on red (for the expected reason, not import errors only) and pass on green. Earlier tests stay green.
- `npm run test:coverage -w backend`: services ≥ 80%.
- `npm run lint` and `npm run format:check` are clean.
