# TruckLink — Bug Log

> Last updated: 2026-06-18
> Testing methodology: Automated E2E (Playwright), integration tests, unit tests, manual exploratory testing

---

## Bug Tracker

| ID | Severity | Status | Page/Area | Title | Found By |
|---|---|---|---|---|---|
| BUG-001 | **Medium** | ✅ Fixed | `/trucks` | Clicking truck card does nothing — gradient overlay intercepts pointer events, no detail modal exists | E2E Suite 2 |
| BUG-002 | **Low** | ✅ Fixed | `/profile` | Recent Bids section not rendered — conditional `length > 0` guard hides section entirely, no empty state | E2E Suite 5 |

---

## Closed Bugs (Fixed)

### BUG-001 — Truck Detail Modal Missing
- **Severity**: Medium
- **Status**: ✅ Fixed
- **Found**: E2E automated test — Suite 2 (Fleet Trucks)
- **Symptom**: Clicking on any truck card on `/trucks` did nothing. Playwright reported the absolute gradient overlay (`bg-gradient-to-t from-card/80`) was intercepting all pointer events on the card.
- **Root Cause**: 
  1. The gradient `<div>` had no `pointer-events-none` class, blocking clicks on underlying elements
  2. No `onClick` handler existed on `TruckCard` component
  3. No truck detail modal or page existed anywhere in the codebase
- **Fix**:
  - Added `pointer-events-none` to the gradient overlay div
  - Added `onClick` prop to `TruckCard` and `cursor-pointer` styling
  - Added `selectedTruck` state to `TrucksPage`
  - Built `TruckDetailModal` Dialog component showing: make/model/year, license plate, truck type, max weight, max length, mileage, fuel level gauge, current location, owner
- **Files Changed**: `artifacts/trucklink/src/pages/trucks.tsx`
- **Verified**: E2E re-test passed ✅

---

### BUG-002 — Profile Page "Recent Bids" Section Missing
- **Severity**: Low
- **Status**: ✅ Fixed
- **Found**: E2E automated test — Suite 5 (Profile page)
- **Symptom**: The Recent Bids section on `/profile` was completely absent from the DOM. The test agent scrolled the full page and found no heading or list for bids.
- **Root Cause**: The component wrapped the entire Recent Bids section in `{recentBids.length > 0 && (...)}`. When a user has no bids, or when the API query returns an empty array, the whole section disappears with no empty state.
- **Fix**:
  - Removed the conditional wrapper; section always renders
  - Added proper loading skeleton while `bidsLoading` is true
  - Added empty state with `Inbox` icon and "No bids placed yet" message
  - Added bid count badge in section header (`N bids`)
  - Added fallback for `bid.load?.title` → `Load #${bid.loadId}` when title is undefined
- **Files Changed**: `artifacts/trucklink/src/pages/profile.tsx`
- **Verified**: E2E re-test passed ✅

---

## Open Bugs

*None currently open.*

---

## Exploratory Testing Observations (Non-Bug)

| # | Area | Observation | Verdict |
|---|---|---|---|
| OBS-001 | `/loads` | Filter label uses "Posted" not "Open" — consistent with DB schema | Expected behavior |
| OBS-002 | `/map` | No explicit error check for JS console errors performed | Monitor |
| OBS-003 | `/routes` | Route names are hardcoded ("I-80", "US-30") regardless of city pair | Known limitation |
| OBS-004 | `/profile` | James Carrier (james@trucklink.com) may show 0 bids if none seeded | Data-dependent |
| OBS-005 | Auth | Demo quick-fill buttons only visible on login page (not register) | By design |
