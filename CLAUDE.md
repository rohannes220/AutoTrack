# AutoTrack — Claude Code Instructions

## Imported context

@docs/PRD.md
@README.md

Each developer may keep personal, untracked notes in `CLAUDE.local.md`.

## Project context

AutoTrack is a web app for a single auto repair shop. Mechanics manage customers, vehicles, and repairs; customers have read-only access to their own vehicles and repair status. This is a two-person CS6983 Project 3 for Rohan Kumar and a partner. The product requirements in `docs/PRD.md` are the source of truth.

Never invent features: build only what a user story in docs/PRD.md asks for; if a request isn't covered, stop and ask.

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

All commands below are **planned** until `package.json` exists.

| Task | Command |
| --- | --- |
| Install | `npm install` |
| Development | `npm run dev` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Backend tests | `npm test` |
| Frontend tests | `npm run test:frontend` |
| E2E tests | `npm run test:e2e` |
| Seed | `npm run seed` |

## Architecture

Planned layout:

- `backend/`: routes -> controllers -> services -> models; Mongoose models live in `models/`.
- `frontend/`: `pages/`, `components/`, and `services/apiClient`.
- `e2e/`: Playwright end-to-end tests.
- `docs/`: requirements and session logs.

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
- Use bcrypt for passwords.
- Check authentication, role, and ownership on the server.
- Do not modify a partner's tests just to make code pass.
- Run lint and tests before committing.
- Do not invent features; follow `docs/PRD.md` and ask when requirements are unclear.
