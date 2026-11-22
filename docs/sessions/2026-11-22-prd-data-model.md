# 2026-11-22 — PRD data model update

## Goal

Record the team meeting decisions (roles, data model, repair statuses, seed data) in `docs/PRD.md` and align `CLAUDE.md`.

## Prompts used

- "Create a branch docs/prd-data-model. Update docs/PRD.md with these team meeting decisions: … Also update CLAUDE.md if any architecture notes conflict. Plan first, show me the diff before committing."

## What changed

- `docs/PRD.md`: The Roles section now says mechanics create, edit, and update records, and customers have read-only access to their own vehicles and repair status. US-03 adds contact info and multiple vehicles per customer. US-04 adds `year`. US-05 adds description, estimated cost, and the status list (Pending/In Progress/Completed). In the §7 data model, Customer and Mechanic no longer have reference arrays, and relationships live on `Vehicle.owner` and `Repair.customer`/`Repair.mechanic`. Seed repairs now cover all statuses. The status Open Question is removed.
- `CLAUDE.md`: The project context now records that repair statuses are resolved.
- Decisions confirmed with the user where the meeting notes were silent: keep login accounts on Customer and Mechanic, keep `repairNumber` and the `customer` reference on Repair, drop the back-reference arrays, and keep seed repairs.

## Test results

Docs-only change; no tests run.

## Problems

- The meeting notes left out login accounts, repair number, and the Repair→Customer link. These were kept to stay consistent with US-01/02/05 and PR #5.
- Two Open Questions remain: whether there is an admin role, and how a new customer account gets its initial password.
