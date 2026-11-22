# 2026-11-21 — US-01 Mechanic login

## Goal

Implement the backend for US-01 (mechanic login, `POST /api/auth/mechanic/login`) on
`feature/us01-mechanic-login` using a strict red-green-refactor TDD cycle. Issue #4.

## Prompts used

1. "Pull master and create branch feature/us01-mechanic-login."
2. "Read US-01 in docs/PRD.md. Use Glob, Grep and Read to explore the backend structure and the
   existing tests. Don't write any code. Summarize what exists and what mechanic login will need."
   (plan mode)
3. "Approved, but go one step at a time. The issue number is 4. First, save this plan … Then do ONLY
   the red step … Then STOP and wait for me."
4. "Green step: implement mechanic login until all tests pass, following the plan. Make sure the $
   operator blocking (sanitizeFilter) is also active in tests …"
5. "Refactor step: extract token signing into utils/jwt.js. No behavior change …"
6. "Write the session log … push the branch and open a PR …"

## Explore

Read-only exploration of `backend/`, the root configs, and `frontend/package.json`. Findings:

- `createApp()` factory in `backend/src/app.js`. Express 5 forwards rejected async handlers to the
  error handler.
- Central error handling via `AppError` + `middleware/errorHandler.js` (`{ error: { message } }`).
- `config/db.js` enables `mongoose.set('sanitizeFilter', true)`.
- `tests/helpers/testDb.js` (mongodb-memory-server) and one health integration test. `models/`,
  `services/` and `tests/unit/` were empty.
- bcrypt and jsonwebtoken were not installed. `env.js` had no JWT settings.
- **Gap:** `testDb.js` called `mongoose.connect` directly and never loaded `config/db.js`, so
  `sanitizeFilter` was off in tests.

## Plan (plan mode)

The plan was saved to `docs/plans/us01-mechanic-login.md`. Questions asked with their answers:

| Question | Answer |
| --- | --- |
| PRD §7 doesn't name the mechanic login identifier. What do mechanics log in with? | Email + password (matches the customer account) |
| Should this branch cover backend only, or also the Mechanic login screen? | Backend only; the frontend page is a follow-up |
| GitHub issue number? | #4 |

## What changed

Commits on the branch:

- `docs(plan): plan mechanic login (#4)`: `docs/plans/us01-mechanic-login.md`.
- `test(auth): red - …`: `tests/unit/authService.test.js`,
  `tests/integration/mechanicLogin.test.js`, `tests/helpers/fixtures.js` (raw-collection mechanic
  fixture, so it doesn't depend on the model under test), `tests/helpers/setupEnv.js` (test JWT
  settings, registered in `jest.config.js`). Installed `bcrypt` and `jsonwebtoken`.
- `chore(auth): add JWT settings to .env.example (#4)`: committed by Rohan (see Problems).
- `feat(auth): green - …`: `models/Mechanic.js`, `services/authService.js`, `utils/validate.js`
  (`requireStrings`), `controllers/authController.js`, `routes/authRoutes.js`, mounted at
  `/api/auth`. `config/env.js` adds `jwtSecret`/`jwtExpiresIn` and fails fast without a secret
  outside tests. `testDb.js` now connects through `config/db.js`. Added
  `tests/integration/sanitizeFilter.test.js`.
- `refactor(auth): refactor - …`: token signing moved to `utils/jwt.js` (`signAccessToken`). No
  behavior change.

## Test results

**Red** (`npm run test:backend`): 9 failed, 1 passed (the existing health test).

- Unit suite: `Cannot find module '../../src/services/authService.js'` (the service doesn't exist yet).
- Integration suite: every test failed with `Received: 404` (the route doesn't exist yet). Each test
  asserts an exact status (200/401/400). The injection test asserts exactly 400, not "not 200", so
  a 404 can't pass it.

**sanitizeFilter probe:** written first and seen failing. In tests, `{ $ne: null }` returned the
stored document. After the green fix, the first version still failed: `CastError`, because the
String field's type casting rejected the filter. The probe field was changed to `Mixed` so the test
checks only sanitizing. It was confirmed to fail with the old `testDb.js` and pass with the new one.

**Green** (`npm run lint`, `npx prettier --check .`, `npm test`): lint and format clean. Backend: 4
suites, 15/15 passed. Frontend: 1/1 passed. `authService.js` coverage: 100%.

**Refactor**: lint and format clean. Backend 15/15, frontend 1/1. `authService.js` and `jwt.js`
both at 100% coverage.

## Problems

- **`.env.example` deny rule:** `.claude/settings.json` denies `.env*` files, so Claude could not
  edit `backend/.env.example`. Claude supplied the lines (`JWT_SECRET=…`, `JWT_EXPIRES_IN=8h`), and
  Rohan added and committed them.
- **Known follow-up (timing difference):** when the email is unknown, `loginMechanic` skips
  `bcrypt.compare`, so it responds measurably faster than for a wrong password. That timing
  difference could be used to work out which emails exist. Fix: compare against a dummy hash when
  no mechanic is found.
- **Commit not on master:** `612aef8 docs(claude): update test commands after scaffold` exists only
  on `chore/scaffold` and never reached master.
- **Audit warnings:** `npm install` reported audit warnings. Not addressed in this session.
