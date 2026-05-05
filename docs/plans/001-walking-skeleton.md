# Walking skeleton implementation plan

## Status

Draft

## Plan version

0.1

## Purpose

This plan describes how to stand up the first working version of Laguuni Quickbook as a **walking skeleton**.

The goal is not full feature completeness. The goal is to establish:

- the application shell
- the core code structure
- the test setup
- a mocked end-to-end booking flow
- CI-ready build, lint, and test behavior

## Walking skeleton definition

The walking skeleton is complete when all of the following are true:

1. The app boots locally with the agreed stack:
   - TypeScript
   - Vite
   - Vitest
   - React
   - Biome
2. A user can open the app and see the availability overview screen.
3. The app can switch between supported cables in the UI.
4. The app can save and reload local settings:
   - name
   - phone
   - email
   - season pass code
   - optional default cable
5. The app shows bookable one-hour slots with capacity information using mocked storefront data.
6. Tapping **Book** runs a mocked booking flow through:
   - basket creation
   - add-to-basket
   - code application path
   - checkout submission
   - success or payment-required result
7. Automated tests run without calling the real API.
8. The repository can lint, test, and build in CI.

## Scope for the skeleton

Included:

- application shell
- mobile-first base layout
- settings persistence
- availability overview
- booking orchestration against mocked API handlers
- deterministic test fixtures

Not included:

- production PWA polish
- real API traffic in automated tests
- advanced error design
- booking history
- richer filters
- multi-person or multi-duration support

## Recommended code structure

```text
src/
  app/
    App.tsx
    main.tsx
    providers.tsx
  domain/
    cable.ts
    slot.ts
    booking.ts
    settings.ts
  features/
    availability/
      components/
      hooks/
      availability-service.ts
      availability.test.tsx
    booking/
      components/
      booking-service.ts
      booking.test.ts
    settings/
      components/
      settings-store.ts
      settings.test.ts
    diagnostics/
      trace-id.ts
      logs.ts
  lib/
    api/
      client.ts
      laguuni-api.ts
      normalize.ts
    storage/
      local-storage.ts
    ui/
      layout/
      primitives/
tests/
  fixtures/
    laguuni/
      availability/
      booking/
      settings/
  msw/
    handlers/
    browser.ts
  server.ts
```

## Structure rules

- Put product concepts in `src/domain`.
- Put user-facing feature code in `src/features`.
- Put API and storage plumbing in `src/lib`.
- Keep feature tests close to the feature when they are small and specific.
- Keep shared fixtures and shared MSW infrastructure under `tests/`.

## Testing strategy

### Recommendation: use MSW, not nock

Use **MSW** as the primary API mocking layer.

Why MSW is the better fit:

- it works naturally with browser-style `fetch`
- it fits React component and integration testing better
- it can support both test-time and local development mocking
- it keeps the app closer to real runtime behavior than Node-only interception

Do **not** rely on real storefront calls in automated tests.

### Fixture strategy

Tests should use **checked-in JSON fixtures captured from real API responses**.

Recommended approach:

1. Capture representative real responses manually.
2. Store them as JSON under `tests/fixtures/laguuni/...`.
3. Normalize unstable values before committing fixtures, such as:
   - basket IDs
   - item IDs
   - timestamps
   - transient tokens
4. Use MSW handlers to serve those fixtures during tests.

This gives the team:

- deterministic tests
- realistic payloads
- no dependency on live availability
- a clear reviewable source of mock data

### Snapshot policy

Prefer **reviewable JSON fixture files** over opaque test-run-generated snapshots.

Use snapshots only for UI output where they add clarity.

For API behavior, the source of truth should be explicit fixture files plus explicit assertions.

### Test layers

1. **Unit tests**

   - domain parsing
   - normalization helpers
   - storage helpers
   - trace/log helpers

2. **Feature integration tests**

   - React component tests with MSW-backed mocked API behavior
   - availability screen
   - settings persistence
   - booking flow result states

3. **Fixture contract tests**
   - verify fixture shape still matches the expectations of the API client layer
   - fail loudly when real fixture samples change in incompatible ways

## Captured storefront integration reference

This section captures the key storefront knowledge already gathered during manual exploration so a new implementer does not need to rediscover it first.

### Product mapping

- Pro -> `6`
- Easy -> `7`
- Hietsu -> `157`

### Basket bootstrap

The storefront creates or recovers a basket with:

```text
GET /api/laguuni/baskets.json
```

This returns a basket token string.

### Availability flow

For V1, availability requests should be modeled around `count=1` and one-hour selection.

Observed sequence:

```text
GET /api/laguuni/products/<productId>/availabledates/<anchor>.json?field=hourlyfrom&count=1&resource_count=1&mode=hours&required_resources
GET /api/laguuni/products/<productId>/availability/<start_ts>.json?count=1
GET /api/laguuni/fi_FI/products/<productId>/availabletimes/<date>.json?count=1
GET /api/laguuni/fi_FI/products/<productId>/availabletimes/<date>.json?capacity=true
```

Useful interpretation:

- `availabledates` drives the date overview
- `availabletimes?count=1` provides bookable start/end combinations
- `availabletimes?capacity=true` provides fullness / free capacity data for display

### Pricing lookup

Observed pricing request shape:

```text
GET /api/laguuni/fi_FI/products/<productId>/fullprices.json?date=<day_ts>&starttime=<HH.mm>&endtime=<HH.mm>&mode=hours&resource_count=1&reservation_count=1
```

### Add-to-basket request

Observed request:

```text
POST /api/laguuni/fi_FI/baskets/<basket>/items/new.json
```

Observed request body shape:

```json
{
  "version": "fi_FI",
  "product_id": "6",
  "count": 1,
  "resource_count": 1,
  "reservation_count": 1,
  "reservation_datestart": "14.5.2026",
  "reservation_timestart": "15.00",
  "reservation_timeend": "16.00"
}
```

For V1, fixture variants should at minimum cover `product_id` values `6`, `7`, and `157`.

### Code checking flow

Observed storefront code validation lookups during discovery:

```text
GET /api/laguuni/valuecards/<code>/public.json
GET /api/laguuni/discounts/<code>/public.json
GET /api/laguuni/vouchers/<code>.json?action=check&basket=<basket>
```

Current application scope only supports the captured discount path:

```text
GET /api/laguuni/discounts/<code>/public.json
```

Fixture coverage should therefore focus on:

- invalid code
- accepted code with zero-balance outcome
- accepted code with payment still required

### Checkout submission flow

Observed sequence:

```text
GET /api/laguuni/rest/put/baskets/<basket>.json?identifier=<basket>&refresh=payment
POST /api/laguuni/fi_FI/orders/<basket>.json
GET /api/laguuni/fi_FI/rest/post/bamborahandler/<token>.json?action=e-payment&domain=shop.laguuniin.fi
```

Observed order submission body shape:

```json
{
  "country": null,
  "email": "test@example.com",
  "name": "Test User",
  "phone": "+358 40 1234567",
  "terms_accepted": 1,
  "payment": "bambora",
  "deliveryRules": [],
  "master": 1,
  "consolidated": 0,
  "allowmarketing": 0,
  "more": null,
  "version": "fi_FI"
}
```

For the walking skeleton, fixtures should stop at one of these deterministic outcomes:

- booking success without payment
- payment required
- booking failure

### Fixture authoring guidance

The first fixture set should include enough captured data to cover:

- one successful availability overview per supported cable
- one add-to-basket success
- one checkout success path
- one payment-required path
- one invalid code path
- one generic failure path

Any dynamic values in captured samples should be normalized to placeholders before they are committed.

## Delivery phases

### Phase 1: repository scaffold

- initialize Vite React TypeScript app
- add Biome
- add Vitest
- add basic scripts for `lint`, `test`, and `build`
- add CI workflow for lint/test/build

### Phase 2: application shell

- create app entrypoint
- create base mobile layout
- create top-level providers
- add placeholder availability and settings screens

### Phase 3: domain and service seams

- define cable, slot, booking, and settings models
- define API client interfaces
- define local storage interfaces
- define booking flow orchestration interface

### Phase 4: mocking infrastructure

- add MSW setup for Vitest
- add `tests/fixtures/laguuni/...`
- add shared MSW handlers backed by fixtures
- add manual fixture capture scripts

### Phase 5: availability overview

- load mocked availability data through the real app data flow
- render grouped dates and slot rows
- show capacity information
- allow cable switching

### Phase 6: settings persistence

- build local settings form
- persist settings locally
- reload settings on app start

### Phase 7: booking skeleton

- wire mocked basket creation
- wire mocked add-to-basket
- wire mocked checkout submission
- surface success and payment-required states

### Phase 8: harden the skeleton

- improve test coverage across all core seams
- add diagnostic trace ID behavior
- ensure no test relies on live network
- clean up naming and folder boundaries

## Initial implementation order inside the codebase

Recommended first file groups:

1. `src/app`
2. `src/domain`
3. `src/lib/api` and `src/lib/storage`
4. `tests/msw` and `tests/fixtures`
5. `src/features/availability`
6. `src/features/settings`
7. `src/features/booking`

## Exit criteria

The walking skeleton is accepted when:

- `lint` passes
- `test` passes
- `build` passes
- the mocked availability overview works for all supported cables
- the mocked booking path completes deterministically without real API traffic
- the code structure clearly separates app shell, domain logic, features, and infrastructure
