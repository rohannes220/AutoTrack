# Product Requirements Document

## 1. Project Overview

AutoTrack is a web app for one auto repair shop. Mechanics manage customer accounts, vehicles, and repair jobs. Customers log in to check the status of repairs for their own vehicles instead of calling the shop. The app supports one shop only.

## 2. Objectives

- Let mechanics manage customer and vehicle records and track repair jobs.
- Let customers securely view their own vehicles and repair statuses.
- Provide seeded sample data and automated tests for the course project.

## 3. Target Users and Roles

### Mechanic

Mechanics log in and can create, edit, and update records. They can create, view, search, and edit customers; create and edit vehicles and link them to customers; create repairs and update their category, description, estimated cost, assigned mechanic, dates, notes, and status; and view the mechanics list and repairs assigned to mechanics. Mechanics create customer accounts; customers do not self-register.

### Customer

Customers log in and have read-only access to their own vehicles and repair status. They cannot view other customers' data or change any records. The API must enforce ownership for every customer-facing data endpoint; the UI alone is not an authorization boundary.

## 4. Features and User Stories

### Authentication

#### US-01 — Mechanic login

As a mechanic, I want to log in so that I can manage shop records.

- A mechanic can submit login credentials.
- Valid mechanic credentials establish an authenticated mechanic session.
- Invalid credentials do not establish a session.

#### US-02 — Customer login

As a customer, I want to log in so that I can check my repair status.

- A customer can submit login credentials for an account created by a mechanic.
- Valid customer credentials establish an authenticated customer session.
- Invalid credentials do not establish a session.
- Customers cannot create their own accounts.

### Customers

#### US-03 — Manage customers

As a mechanic, I want to create, edit, view, and search customer records so that I can keep shop records current.

- A mechanic can create a customer record and customer login account.
- A customer record holds the customer's name and contact information.
- A customer can own multiple vehicles.
- A mechanic can edit and view a customer record.
- A mechanic can search customer records.
- Customers cannot create or edit customer records.

### Vehicles

#### US-04 — Manage vehicles

As a mechanic, I want to create and edit vehicles and link them to a customer so that each customer's vehicles are recorded correctly.

- A mechanic can create and edit a vehicle record.
- A mechanic can link a vehicle to a customer.
- A vehicle records its make, model, year, color, state, license plate, and owner.
- A license plate is unique within its state (the combination of state and license plate is unique).

### Repairs

#### US-05 — Manage repairs

As a mechanic, I want to create and update repair jobs so that the shop can track work on each vehicle.

- A mechanic can create a repair linked to a vehicle, customer, and mechanic.
- A repair records its unique human-readable repair number, category, description, status, estimated cost, date received, and expected completion date, plus optional notes.
- The category is Oil, Electronics, Engine, or Body.
- The status is Pending, In Progress, or Completed.
- A mechanic can update the assigned mechanic, category, description, estimated cost, dates, optional notes, and status.
- Repair status is stored on the repair, not on the customer or vehicle.

#### US-06 — View own repairs

As a customer, I want to view my repairs and their status so that I can check progress without calling the shop.

- A customer can view repairs linked to their own customer account.
- A customer can view status for those repairs.
- Attempts to access another customer's repairs return no other customer's data.
- Customers cannot create or change repairs.

### Mechanics

#### US-07 — View mechanics and assignments

As a mechanic, I want to see the mechanics list and assigned repairs so that I can review repair assignments.

- The mechanics list contains the five seeded mechanics.
- A mechanic can view repairs assigned to a mechanic.
- Each repair assignment refers to the mechanic and repair records.

## 5. Application Screens

- Mechanic login
- Customer login
- Mechanic customer list/search and customer detail/edit
- Mechanic vehicle create/edit
- Mechanic repair create/update
- Mechanics list and assigned repairs
- Customer's vehicles and repairs/status

## 6. Technology Stack

| Area | Technology |
| --- | --- |
| Backend | Node 20, Express |
| Database and ODM | MongoDB, Mongoose |
| Authentication | JWT, bcrypt |
| Frontend | React 18, Vite |
| Backend tests | Jest, Supertest |
| Frontend tests | Vitest, React Testing Library |
| End-to-end tests | Playwright |
| Code quality | ESLint, Prettier |
| CI | GitHub Actions |

## 7. Data Model

| Collection | Fields and references | Constraints |
| --- | --- | --- |
| Customer | Name, contact information, login account (email, bcrypt password hash, role `customer`) | Customers are created by mechanics, not by self-registration. A customer can own multiple vehicles (via `Vehicle.owner`). |
| Vehicle | Make, model, year, color, state (US state code), licensePlate, owner (reference to Customer) | License plate is unique per state: `state` + `licensePlate` must be unique together. |
| Repair | repairNumber, vehicle (reference to Vehicle), customer (reference to Customer), mechanic (reference to Mechanic), category, description, status, estimatedCost, dateReceived, expectedCompletionDate, notes (optional) | Repair number is unique. Category is Oil, Electronics, Engine, or Body. Status is Pending, In Progress, or Completed and belongs to each repair. |
| Mechanic | Name, position, login account (email, bcrypt password hash, role `mechanic`) | Seed five mechanics. |

Relationships are stored once, on the referencing document: a customer's vehicles are found by `Vehicle.owner`, and a customer's or mechanic's repairs by `Repair.customer` or `Repair.mechanic`. Customer and Mechanic do not store reference arrays.

Seed data consists of five mechanics, 20 customers, 20 vehicles (with some customers owning multiple vehicles), and sample repairs across all four categories and all three statuses.

## 8. API Endpoints

These are planned endpoints. All customer data access must be scoped on the server to the authenticated customer's customer ID; a client-supplied customer ID must never widen access.

| Method | Path | Description | Required role |
| --- | --- | --- | --- |
| POST | `/api/auth/mechanic/login` | Log in as a mechanic | Public |
| POST | `/api/auth/customer/login` | Log in as a customer | Public |
| GET | `/api/customers` | List/search customers | Mechanic |
| POST | `/api/customers` | Create a customer and customer account | Mechanic |
| GET | `/api/customers/:customerId` | View a customer | Mechanic |
| PATCH | `/api/customers/:customerId` | Edit a customer | Mechanic |
| GET | `/api/vehicles` | List vehicles | Mechanic |
| POST | `/api/vehicles` | Create a vehicle and link it to a customer | Mechanic |
| PATCH | `/api/vehicles/:vehicleId` | Edit a vehicle or its customer link | Mechanic |
| GET | `/api/me/vehicles` | View the authenticated customer's vehicles; server filters by own customer ID | Customer (own data only) |
| POST | `/api/repairs` | Create a repair | Mechanic |
| PATCH | `/api/repairs/:repairId` | Update a repair | Mechanic |
| GET | `/api/me/repairs` | View the authenticated customer's repairs; server filters by own customer ID | Customer (own data only) |
| GET | `/api/me/repairs/:repairId` | View one of the authenticated customer's repairs; server verifies ownership | Customer (own data only) |
| GET | `/api/mechanics` | List mechanics | Mechanic |
| GET | `/api/mechanics/:mechanicId/repairs` | View repairs assigned to a mechanic | Mechanic |

All non-login endpoints require authentication and enforce the listed role. Customer-facing routes must derive ownership from the authenticated identity and return no other customer's documents.

## 9. Testing Strategy

Use TDD with a red-green-refactor cycle: write a failing test, implement the smallest behavior that passes, then refactor while keeping tests green.

- Backend unit tests use Jest; API integration tests use Supertest.
- Frontend tests use Vitest and React Testing Library.
- End-to-end tests use Playwright and a test database, never a real database.
- Test authorization and customer ownership boundaries, including attempts to read another customer's records.
- Target at least 80% coverage on backend services.

## 10. Out of Scope

- Multiple shops or multi-tenant support
- Payments or invoicing
- Parts inventory
- Customer self-registration
- Notifications

## 11. Milestones

1. Establish project documentation and development configuration.
2. Implement data models, authentication, and authorization.
3. Implement mechanic customer, vehicle, and repair workflows.
4. Implement customer read-only access to own vehicles and repairs.
5. Add seed data and unit, API integration, frontend, and end-to-end tests.

## 12. Open Questions

- Do mechanics need an admin/manager role to create other mechanics?

### Resolved

- **How does a new customer account get its password?** The mechanic sets a temporary password when creating the customer account. It is stored only as a bcrypt hash, and customers are not forced to change it.
