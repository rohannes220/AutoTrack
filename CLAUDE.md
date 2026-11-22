# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Imported context

@docs/PRD.md
@README.md

Each developer may keep personal, untracked notes in `CLAUDE.local.md`.

## Project context

Single-shop repair tracker for CS6983 Project 3 (team listed in README): mechanics manage records, and customers get read-only access to their own data. `docs/PRD.md` is the source of truth.

Never invent features: build only what a user story in docs/PRD.md asks for; if a request isn't covered, stop and ask. The PRD's Open Questions (§12) are unresolved — repair status list and order, whether an admin role exists, and how a new customer account gets its password. Ask before building anything that depends on them.

## Tech stack

| Area | Technology |
| --- | --- |
| Backend | Node 20, Express, MongoDB, Mongoose |
| Authentication | JWT, bcrypt |
| Frontend | React 18, Vite |
| Backend tests | Jest, Supertest |
| Frontend tests | Vitest, React Testing Library |
| E2E tests | Playwright |
| Quality and CI | ESLint, Prettier, GitHub Actions |

## Commands

The repo is an npm workspaces monorepo: a root `package.json` with `"workspaces": ["backend", "frontend"]`. Root scripts delegate to the workspaces; Playwright runs from the root. All commands below are **planned** and unverified until `package.json` exists.

| Task | Command |
| --- | --- |
| Install (all workspaces) | `npm install` |
| Add a dependency | `npm install <pkg> -w backend` (or `-w frontend`) |
| Development | `npm run dev` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Backend tests | `npm test` |
| Single backend test file | `npm test -w backend -- tests/unit/<name>.test.js` |
| Backend tests by name | `npm test -w backend -- -t "<test name>"` |
| Frontend tests | `npm run test:frontend` |
| Single frontend test file | `npm test -w frontend -- src/<path>.test.jsx` |
| E2E tests | `npm run test:e2e` |
| Single E2E spec | `npx playwright test e2e/<name>.spec.js` |
| Seed | `npm run seed` |

`.claude/settings.json` denies reading `.env*` files and running `curl`/`wget`, so don't try them. Use `.env.example` for configuration keys.

## Architecture

Layout (scaffolded; folders are empty until implemented):

- `backend/src/`: request flow is `routes/` -> `controllers/` -> `services/` -> `models/` (Mongoose).
  - `middleware/`: JWT authentication, role guards, customer-ownership guards, and the centralized error handler.
  - `config/`: environment and database connection. `utils/`: shared helpers.
- `backend/tests/`: `unit/` (Jest, mainly services), `integration/` (Supertest against the Express app), `helpers/` (test DB setup and fixtures).
- `frontend/src/`: `pages/` (one per PRD screen), `components/`, `context/` (auth state: token and role), `services/` (`apiClient` attaches the JWT).
- `e2e/`: Playwright end-to-end tests.
- `docs/`: `PRD.md`, `plans/` (implementation plans), `sessions/` (session logs).

Key decisions:

- Send JWTs in the `Authorization` header.
- Enforce roles and ownership in the API, never only in the UI.
- Validate all input on the server.
- Customers can read only documents linked to their own customer ID.
- Use centralized error-handling middleware.
- Never build MongoDB queries from raw request objects. Reject keys starting with `$` to prevent operator injection.

## Coding conventions

- Use ES modules and `async`/`await`.
- Format with Prettier: single quotes, semicolons, trailing commas, and 100 columns.
- Use `camelCase` for variables and `PascalCase` for React components.
- Give every form input an accessible label.

## Testing strategy

Follow TDD: commit failing tests first, implementation second, optional cleanup last. Use Conventional Commits that identify the phase, for example:

- `test(repairs): red - add failing tests for repair status update (#12)`
- `feat(repairs): green - implement repair status update (#12)`
- `refactor(repairs): refactor - extract status rules (#12)`

Target 80% coverage on backend services. E2E tests must use a test database, never a real one.

## Workflow

Explore with Glob/Grep/Read -> Plan in Plan mode -> Implement -> Commit. Use branches named `feature/<issue#>-description`, `fix/<issue#>-description`, `docs/<issue#>-description`, or `test/<issue#>-description`. Pull requests should include `Closes #<issue>` and a note describing what was AI-assisted. Both partners commit and review.

Do not commit or push unless asked.

## Session logs

Save a short log of each Claude Code session to `docs/sessions/YYYY-MM-DD-<topic>.md`. Include the goal, prompts used, what changed, test results, and problems.

## Context management

- Use `/clear` between unrelated tasks.
- Use `/compact` with a focus hint in long sessions.
- Use `claude --continue` to resume the last session and `claude --resume` to resume an older one.

## Do's and Don'ts

- Keep secrets out of git. `.env*` files are ignored except `.env.example`.
- Do not modify a partner's tests just to make code pass.
- Run lint and tests before committing.
