# TruckLink — Master Test Plan

> Version: 1.0 | Date: 2026-06-18 | Methodology: TDD + Exploratory + Automation

---

## 1. Scope

This document covers all testing activities for TruckLink — a full-stack trucking SaaS platform.

| Layer | Coverage |
|---|---|
| Unit Tests | Pure business logic: Haversine, cost calc, role auth, status transitions |
| Integration Tests | All API endpoints: auth, trucks, loads, bids, analytics, chat, routes |
| E2E / UI Tests | Full user flows via Playwright (automated) |
| Exploratory Testing | Manual-style automated walkthroughs of each page |
| Security Tests | Headers, rate limiting, JWT validation, authorization checks |

---

## 2. Test Driven Development (TDD) Approach

For each feature, tests were written to define expected behavior **before** validating implementation:

### TDD Cycle Applied
1. **Red** — Write failing test that describes expected behavior
2. **Green** — Verify implementation makes test pass
3. **Refactor** — Clean up without breaking tests

### TDD Examples Applied in This Project

| Feature | Test First | Outcome |
|---|---|---|
| Haversine distance | Test asserted `Chicago → LA ≈ 1745mi` | Implementation verified correct |
| Role-based bid placement | Test asserted shippers get 403 | Implementation confirmed correct |
| Load status transitions | Test asserted delivered is terminal | Implementation confirmed correct |
| Bid acceptance flow | Test asserted other bids are rejected | Implementation confirmed correct |
| Toll cost when avoidTolls=true | Test asserted cost = $0 | Implementation confirmed correct |

---

## 3. Test Suites

### 3.1 Unit Tests (`artifacts/api-server/src/__tests__/unit.test.ts`)

| Suite | Tests | What is Verified |
|---|---|---|
| `haversineDistance` | 5 | Zero distance, Chicago→LA, NYC→Dallas, symmetry, non-negative |
| `Route cost calculations` | 5 | Fuel cost positive, toll=0 when avoided, road factor 1.22x, linear duration |
| `JWT token logic` | 3 | Sign with 24h expiry, null on invalid, payload returned on valid |
| `Input validation` | 6 | Email format, bid amounts, fuel level range |
| `Load status transitions` | 6 | All valid transitions, terminal state enforcement, cancellation |
| `Role authorization` | 10 | Bid placement, bid acceptance, truck modification per role |

**Run:** `pnpm --filter @workspace/api-server run test:unit`

### 3.2 Integration Tests (`artifacts/api-server/src/__tests__/integration.test.ts`)

| Endpoint Group | Tests | What is Verified |
|---|---|---|
| `POST /api/auth/login` | 6 | Valid login, JWT returned, wrong password, unknown email, missing fields |
| `GET /api/auth/me` | 3 | Auth required, valid user returned, no passwordHash |
| `POST /api/auth/register` | 2 | Duplicate email rejected, missing fields |
| `GET /api/trucks` | 5 | List, auth required, status filter, no passwordHash in owner |
| `GET /api/trucks/telematics` | 1 | Live positions with lat/lng/speed |
| `GET /api/loads` | 4 | List, auth required, required fields present, status filter |
| `POST /api/bids` | 5 | Driver can bid, shipper cannot, auth required, missing fields |
| `GET /api/bids` | 2 | List, no passwordHash exposed |
| `GET /api/analytics/dashboard` | 2 | KPIs returned, auth required |
| `GET /api/analytics/loads` | 1 | Monthly chart data |
| `GET /api/analytics/revenue` | 1 | Revenue chart data |
| `POST /api/chat/message` | 3 | Load query, route query, auth required |
| `POST /api/routes/optimize` | 3 | Full route data, toll=0 when avoided, auth required |
| Security headers | 2 | X-Content-Type-Options, X-Frame-Options |

**Run:** `pnpm --filter @workspace/api-server run test:integration`

### 3.3 E2E / UI Tests (Playwright via testing subagent)

| Suite | User | Pages | Status |
|---|---|---|---|
| Suite 1: Auth & Navigation | admin@trucklink.com | `/`, `/login`, `/dashboard`, `/profile` | ✅ PASS |
| Suite 2: Fleet Trucks | admin@trucklink.com | `/trucks` (with modal) | ✅ PASS (after BUG-001 fix) |
| Suite 3: Loads & Bidding | mike@trucklink.com (Driver) | `/loads`, `/loads/:id` | ✅ PASS |
| Suite 4: Map & Routes | sarah@trucklink.com (Dispatcher) | `/map`, `/routes` | ✅ PASS |
| Suite 5: Profile & Chatbot | james@trucklink.com (Carrier) | `/register`, `/profile`, chatbot | ✅ PASS (after BUG-002 fix) |

**Run:** Automated via Playwright testing subagent

---

## 4. Exploratory Testing Checklist

### Authentication
- [x] Landing page loads with hero + CTA
- [x] Login page has email/password fields
- [x] Demo quick-fill buttons work (all 5 accounts)
- [x] Valid login redirects to dashboard
- [x] Wrong password returns error
- [x] Register page has role selection + form
- [x] New registration creates account and logs in

### Dashboard
- [x] KPI cards render (Total Trucks, Active Loads, Revenue, Drivers)
- [x] Line chart renders with data
- [x] Bar chart renders with data
- [x] Pie chart renders with load status breakdown
- [x] Recent loads table is visible

### Trucks
- [x] Fleet grid renders with 10 trucks
- [x] Status filter works (Available, In Transit, Maintenance, Inactive)
- [x] Type filter works
- [x] Clicking a truck card opens detail modal (**Fixed BUG-001**)
- [x] Modal shows: make/model/year, license plate, fuel gauge, mileage, location, owner

### Loads
- [x] Load board renders with multiple loads
- [x] Status filter works
- [x] Each load shows origin → destination, freight type, budget, bid count
- [x] Clicking a load goes to detail page
- [x] Bid form is present on open loads
- [x] Placing a bid shows success toast
- [x] Placed bid appears in bid list

### Map
- [x] Leaflet dark map renders
- [x] Truck markers visible on map
- [x] Clicking a marker shows popup (status, speed, fuel)
- [x] Socket.io updates truck positions every 5s

### Routes
- [x] City picker dropdowns present
- [x] Optimize button triggers calculation
- [x] Results show distance, duration, fuel cost, toll cost
- [x] 5 waypoints displayed
- [x] 3 alternative routes displayed

### Profile
- [x] User name, email, role, company displayed
- [x] Stats: Total Loads, Rating, Member Since
- [x] Edit Profile form works (inline edit)
- [x] Recent Bids section always visible (**Fixed BUG-002**)
- [x] Empty state shown when no bids

### Chatbot
- [x] Chat bubble visible bottom-right
- [x] Clicking opens chat window
- [x] Quick reply chips present
- [x] Bot responds to load queries
- [x] Bot responds to route queries

---

## 5. Security Test Cases

| Test | Expected | Result |
|---|---|---|
| Missing JWT → protected route | 401 Unauthorized | ✅ |
| Invalid JWT → protected route | 401 Invalid token | ✅ |
| Shipper places bid | 403 Forbidden | ✅ |
| Driver accepts someone else's bid | 403 Forbidden | ✅ |
| User edits another user's profile | 403 Forbidden | ✅ |
| Withdraw accepted bid | 409 Conflict | ✅ |
| SESSION_SECRET missing on startup | Server throws error | ✅ |
| Password hash in API response | Not exposed | ✅ |
| Helmet CSP headers set | Present on all routes | ✅ |
| X-Content-Type-Options header | nosniff | ✅ |
| Rate limit on /auth routes | 20 req/15min | ✅ |
| Body size limit | 100kb | ✅ |

---

## 6. Defects Summary

| ID | Severity | Title | Status |
|---|---|---|---|
| BUG-001 | Medium | Truck card click intercepted by gradient overlay — no detail modal | ✅ Fixed |
| BUG-002 | Low | Profile Recent Bids section hidden when empty — no empty state | ✅ Fixed |

---

## 7. Test Automation Commands

```bash
# Unit tests (pure business logic)
pnpm --filter @workspace/api-server run test:unit

# Integration tests (live API endpoints)
pnpm --filter @workspace/api-server run test:integration

# All tests
pnpm --filter @workspace/api-server run test

# With coverage report
pnpm --filter @workspace/api-server run test:coverage

# TypeScript type checking (both packages)
pnpm run typecheck
```
