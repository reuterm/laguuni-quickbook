# ADR 001: Technical direction

## Status

Accepted

## Summary

| Question | Recommendation |
| --- | --- |
| How is it implemented? | A **client-side web app** built with **TypeScript**, **React**, and **Vite** |
| How is it deployed? | Built and deployed automatically with **GitHub Actions** on pushes to `main` |
| How is it served? | Served as a **static site** from **GitHub Pages** |

## 1. How it is implemented

Laguuni Quickbook should be implemented as a **browser-only single-page application**.

Recommended stack:
- **TypeScript** for application code
- **React** for UI composition
- **Vite** for local development and production builds

Recommended architectural constraints:
- no application backend for V1
- no server-rendered runtime
- direct browser calls to the Laguuni storefront API
- user profile and settings stored locally in the browser

### Why this is the right implementation shape
- The product is fundamentally a **mobile-first browser app**, not a server product.
- V1 does not need server-side rendering, API routes, or backend sessions.
- The critical behavior is booking flow orchestration in the browser:
  - load availability
  - create basket
  - add reservation
  - apply code
  - submit checkout
- A small client-only app keeps the architecture aligned with the privacy model.

### Why React + TypeScript + Vite
- **React** is a safe, well-supported UI choice for a small mobile-first app.
- **TypeScript** helps keep the storefront API integration and local data model explicit.
- **Vite** gives a fast development loop and produces a static build without forcing a server runtime.

### What not to use for V1
- No Next.js-style full-stack framework
- No backend API wrapper around the Laguuni API
- No React Native / native mobile app shell
- No production dependency on browser automation

## 2. How it is deployed

The application should be deployed with **GitHub Actions**.

Recommended deployment flow:
1. push to `main`
2. GitHub Action installs dependencies
3. GitHub Action builds the static site
4. GitHub Action deploys the built artifact to GitHub Pages

This keeps deployment close to the repository and avoids introducing another required platform for V1.

## 3. How it is served

The application should be served as a **static website** from **GitHub Pages**.

That means:
- HTML, CSS, JavaScript, icons, and manifest are served as static assets
- there is no application server at runtime
- all dynamic behavior happens in the browser against the Laguuni storefront API

### Why static hosting is the right serving model
- The app does not need a backend to meet the product requirements.
- Static hosting is the simplest and lowest-maintenance option.
- It works naturally with installable-browser-app behavior later if PWA polish is added.
- It keeps infrastructure almost trivial while the product is still proving itself.

## 4. What this choice buys us

This combination gives:
- the smallest operational footprint
- near-zero infrastructure complexity
- a straightforward path from product spec to implementation
- a stack that still allows later PWA polish without re-architecting the app

## 5. Trade-offs

This approach intentionally gives up:
- server-side control over API requests
- centralized analytics or user accounts
- cross-device syncing of saved settings
- backend-mediated retries or request smoothing

Those trade-offs are acceptable for V1 because the product is a personal browser tool with local-only user data.

## 6. Diagnostics and support

V1 should assume **no centralized logging service**.

Instead, the application should support **local diagnostic logging** that stays on the user's device unless they explicitly choose to export it.

Recommended support model:
- keep a local in-browser log buffer for recent app activity
- allow the user to export logs manually when troubleshooting is needed
- make exported logs easy to share as a file or plain text

The diagnostic log should be **PII-free by design** and rely on a generated trace or session identifier for correlation instead of personal data.

It should include things like:
- timestamps
- app version
- browser / platform
- generated trace ID
- booking flow step names
- request targets and status codes
- user-visible error states

It must not include raw personal data or raw season pass / code values.

If centralized logging is ever added later, the same redaction rule must still apply before any log leaves the user's device.

## 7. Future flexibility

If the product later outgrows GitHub Pages, the implementation choice can stay the same.

The app could later move to another static host such as Cloudflare Pages or Netlify without changing the core application architecture.
