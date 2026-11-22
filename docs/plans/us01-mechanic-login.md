# US-01 Mechanic Login: exploration summary and plan

## Context
US-01: a mechanic submits credentials; valid ones give an authenticated mechanic session, invalid ones don't. PRD §8 endpoint: `POST /api/auth/mechanic/login` (public). This plan covers the backend first. No code has been written yet.

## What exists (backend)
- `backend/src/app.js`: `createApp()` factory (Express 5, `express.json()`, `/api/health`, then `notFound` and `errorHandler`). Supertest uses it directly.
- `backend/src/config/db.js`: `connectDb`/`disconnectDb`. Sets `mongoose.set('sanitizeFilter', true)` to block `$` operator injection.
- `backend/src/config/env.js`: `nodeEnv`, `port`, `mongoUri`. No JWT settings yet.
- `backend/src/middleware/errorHandler.js` + `backend/src/utils/AppError.js`: central error handling with the shape `{ error: { message } }`. Express 5 forwards rejected async handlers automatically.
- Pattern to copy: `routes/healthRoutes.js` → `controllers/healthController.js`.
- Tests: `tests/integration/health.test.js` (Supertest) and `tests/helpers/testDb.js` (mongodb-memory-server: `connectTestDb`/`clearTestDb`/`closeTestDb`). `tests/unit/` is empty. Jest runs native ESM with `--experimental-vm-modules`.
- `models/` and `services/` are empty. **bcrypt and jsonwebtoken are not installed.**
- `.env.example` has no `JWT_SECRET`.

## Gaps and risks found
1. `testDb.js` calls `mongoose.connect` directly and never imports `config/db.js`, so `sanitizeFilter` is **off in tests**. Tests would miss injection behavior. Fix: move the `mongoose.set` call somewhere both paths load (e.g. the model module, or import `config/db.js` in `testDb.js`).
2. The PRD's Mechanic model lists "login account (role `mechanic`)" without saying what the identifier is. The Customer model uses email.
3. Mechanics come only from seeding (US-07). Mechanic creation and an admin role are open questions (PRD §12), so this work adds no sign-up or create-mechanic endpoint. Tests use fixtures.

## Decisions (confirmed with user)
- Mechanics log in with **email + password**.
- This branch is **backend only**. The frontend login page is a follow-up.
- Issue: #4 (used in commit messages and `Closes #4`).

## Plan (TDD, backend)
**Dependencies:** `npm install bcrypt jsonwebtoken -w backend`. Add `JWT_SECRET` and `JWT_EXPIRES_IN` to `.env.example` and `config/env.js`. Fail fast if `JWT_SECRET` is missing outside tests.

**Red commit:** `test(auth): red - add failing tests for mechanic login (#4)`
- `tests/unit/authService.test.js`: valid credentials return a token whose payload has `sub` = mechanic id and `role: 'mechanic'`; a wrong password throws a 401 `AppError`; an unknown identifier throws the same 401 with the same message (no user enumeration).
- `tests/integration/mechanicLogin.test.js` (memory DB, fixture mechanic hashed with bcrypt):
  - 200 + `{ token, mechanic: { id, name, position } }`; the response never includes the password hash
  - wrong password → 401, no token
  - unknown user → 401, same body
  - missing or non-string fields → 400
  - `{ "email": { "$ne": null } }` → 400/401, never 200 (injection)

**Green commit:** `feat(auth): green - implement mechanic login (#4)`
- `models/Mechanic.js`: `name`, `position`, `email` (unique, lowercase, trimmed), `passwordHash` (`select: false`), `role` fixed to `'mechanic'`, `assignedRepairs: [ObjectId ref Repair]`.
- `services/authService.js`: `loginMechanic({ email, password })` looks up with `.select('+passwordHash')`, runs `bcrypt.compare`, then `jwt.sign({ sub, role }, secret, { expiresIn })`.
- `utils/validate.js` (or inline): require string `email`/`password` and reject anything else with a 400 `AppError`.
- `controllers/authController.js`, `routes/authRoutes.js` (`POST /mechanic/login`), mounted at `/api/auth` in `app.js`.

**Refactor (optional):** extract token signing into `utils/jwt.js` so the future auth middleware can share it.

**Out of scope here:** auth/role-guard middleware (it comes with the first protected endpoint), the customer login (US-02), seeding (US-07), and the frontend login page (a separate slice unless you say otherwise).

## Verification
- `npm run test:backend`: new tests fail on the red commit and pass on green.
- `npm test -w backend -- --coverage`: `authService` coverage ≥ 80%.
- `npm run lint` and `npm run format:check` pass.
- Manual: `npm run dev -w backend` with a local Mongo and one inserted mechanic, then POST login from a REST client. (curl is denied by settings.)
