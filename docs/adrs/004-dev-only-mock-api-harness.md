# ADR 004: Dev-only mock API harness for end-to-end UI testing

## Status

Proposed

## Summary

| Question | Decision |
| --- | --- |
| How should local UX/UI testing avoid real storefront side effects? | Use a **dev-only browser mock API harness** built on **MSW** |
| Where should mock scenario controls live? | Inside the existing hidden **developer mode** UI |
| Should mock tooling be available in production when developer mode is enabled? | **No**. Developer mode may remain available, but mock API tooling remains **dev-only** |
| How should mock mode be activated locally? | **Off by default**, enabled explicitly by the developer |
| At what layer should the app be mocked? | At the **network interception layer**, not by swapping in a fake domain API implementation |

## Context

Laguuni Quickbook is a browser-only application that calls the live Laguuni storefront API directly from the client.

That architecture is intentionally simple and aligned with the product direction, but it creates a UX testing problem in local development:

- important UI flows depend on live API responses
- some flows have real-world side effects
- failure and edge-case states are difficult to reproduce safely
- manual end-to-end validation currently depends too much on live backend behavior

The application already has some strong building blocks for solving this:

- the runtime app has a hidden developer mode in Settings
- API traffic is centralized through a single HTTP client and `LaguuniApi` adapter layer
- the test suite already uses `msw`
- the repository already contains fixture-backed request handlers for availability and booking flows

Those pieces make it possible to introduce a local-only UX/UI testing harness without changing the product's production architecture.

## Decision

Adopt a **dev-only mock API harness** for local UX/UI testing using **MSW in the browser**.

The harness should allow local developers to exercise the real application UI against deterministic mocked responses, including success, failure, and edge-case states, without sending live requests that cause real-world effects.

This means:

- mock behavior is implemented through browser request interception
- scenario controls are exposed only through the existing hidden developer mode UI
- mock mode is disabled by default and enabled explicitly by the local developer
- the mock harness is available only in local development builds
- production builds do not include the mock API harness in the production bundle
- production builds do not activate browser request interception

Developer mode and mock mode are separate concerns:

- **developer mode** is a shipped diagnostic/debugging surface
- **mock API mode** is a local development capability

## Why this approach

### 1. It tests the real UI flow without live side effects

The main problem is not unit testing business logic in isolation. The problem is validating the actual user experience safely:

- loading availability
- selecting slots
- confirming bookings
- observing submitting states
- handling checkout failures
- handling payment-required flows
- verifying recovery and dismissal behavior

Intercepting real browser requests preserves the real application flow while removing live side effects.

### 2. It fits the existing architecture and tooling

This repository already has:

- `msw` in the test stack
- browser and node handler setup
- fixture-backed handlers for the Laguuni storefront contract
- a hidden developer-mode surface in Settings

That makes a browser-level MSW harness the most natural extension of the current codebase rather than a new testing subsystem.

### 3. It is more realistic than replacing the domain API with a fake implementation

A fake `LaguuniApi` implementation would test less of the real app behavior.

Mocking at the network layer continues to exercise:

- request path construction
- query parameter shape
- request body shape
- response decoding
- error handling
- loading-state transitions
- flow orchestration across multiple requests

That gives better confidence in the UI and integration behavior than swapping in a fully fake service object.

### 4. It preserves a clear production safety boundary

The app should never risk accidentally switching a deployed production build into a mocked mode.

Keeping the mock harness dev-only avoids:

- accidental suppression of real requests in production
- shipping fixture and interception code unnecessarily
- confusion about whether a deployed app is live or simulated

That boundary is especially important because this app talks directly to an external storefront API and some actions have real effects.

## Dev and production boundary

The runtime model should be:

- **Production**
  - developer mode may expose safe tools such as diagnostics export and log clearing
  - mock API controls do not render
  - request interception does not start
  - scenario fixtures are not part of the production runtime path
  - dev-only mock code should stay out of the production bundle

- **Local development**
  - developer mode may additionally expose mock API controls
  - the developer can explicitly enable mock mode
  - browser requests are intercepted by MSW when mock mode is enabled
  - scenario state can be changed locally to drive specific UI outcomes

This keeps production-safe tooling and local-only simulation tooling clearly separated.

## Activation model

The local activation model should be explicit.

Recommended behavior:

- mock API mode is **off by default**
- the developer enables it manually from the developer mode UI
- the selected scenario persists locally for convenience across reloads

Optional local shortcuts such as query parameters may be added later, but they are an implementation option rather than part of the required product behavior.

If added, they should act as a convenience for local development and not replace the explicit in-app control model.

## Scenario model

The mock harness should support deterministic scenario presets that exercise meaningful user-visible states.

Initial scenarios should cover at least:

- default happy path
- availability loading failure
- availability response delay
- invalid discount / season pass code
- add-to-basket failure
- checkout failure
- payment required
- malformed or unexpected response shape
- post-payment cleanup failure

The goal is not to simulate every theoretical backend condition immediately. The goal is to cover the UX states that matter for local testing and regression checking.

## Consequences

### Positive

- local UI testing no longer depends on live side effects
- failure and edge states become easy to reproduce on demand
- the real browser request and decoding path remains exercised
- the solution reuses existing test fixtures and handler infrastructure
- developers get a fast and deterministic manual QA loop
- production behavior remains clean and unambiguous

### Trade-offs

- the app gains a dev-only runtime path that must be maintained
- fixture realism must be kept in sync with the live API contract
- scenario state introduces some additional local tooling complexity
- contributors must understand the distinction between developer mode and mock mode
- browser-intercepted mocks still do not replace validation against the live API entirely

## Implementation notes

The initial implementation should proceed in this order:

1. Add a dev-only bootstrap path that can start the MSW browser worker through a development-gated dynamic import.
2. Keep the dev-only mock bootstrap and related fixtures out of the production bundle.
3. Refactor the existing MSW handlers so they can read a mutable local scenario state rather than always returning only the default fixtures.
4. Introduce local persisted mock-mode state for:
   - enabled/disabled
   - selected scenario
   - optional latency
5. Add a mock API section to the existing developer mode UI in Settings.
6. Reuse existing fixtures to implement the initial scenario presets before adding any new fixture surface.
7. Add integration tests that verify:
   - mock tooling is available in dev conditions
   - mock tooling is absent in production conditions
   - selected scenarios drive the intended user-visible states

## Non-goals

This ADR does not introduce:

- a production mock mode
- a second permanent fake implementation of the domain API
- a backend proxy or server-side simulation layer
- browser automation as a required runtime dependency
- removal of live API testing entirely
- a permanent user-facing testing console outside developer mode

## Alternatives considered

### 1. Ship the mock harness to production behind developer mode

Rejected.

This would blur the line between safe diagnostics tooling and request simulation. It would also increase the chance of confusion or accidental misuse in deployed builds.

### 2. Replace the domain API with a fake in-memory implementation in dev mode

Rejected.

This would be simpler in some ways, but it would bypass important behavior in the request-building and response-decoding layers and would duplicate behavior already represented in the MSW fixtures.

### 3. Rely only on automated tests and avoid an in-app local harness

Rejected.

Automated tests are still useful, but they do not replace the need for deterministic local manual testing of the real interactive flow, especially when live calls have external side effects.

## Future evolution

Later work may add:

- deep-link query parameters for opening specific scenarios quickly in local development
- richer per-step scenario overrides
- fixture capture refresh workflows when the live storefront contract changes
- additional scenario presets for diagnostics and app-level runtime failures
- developer-facing helpers for seeding local settings or mock booking state
