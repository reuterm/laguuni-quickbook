# Laguuni Quickbook

A mobile-first browser app for quickly booking Laguuni wakeboarding slots.

## Docs

- Product spec: [`docs/specs/product.md`](docs/specs/product.md)
- Technical direction: [`docs/adrs/001-technical-direction.md`](docs/adrs/001-technical-direction.md)
- UI foundation: [`docs/adrs/002-ui-foundation.md`](docs/adrs/002-ui-foundation.md)

## Tooling

This repository uses `mise` to manage tool versions and `pnpm` for package management.

## Environment configuration

- `VITE_LAGUUNI_API_BASE_URL`: storefront API base used by the browser app
- `LAGUUNI_API_BASE_URL`: storefront API base used by Node-side tooling and fixture capture
- `BASE_PATH`: optional build-time base path for static hosting under a subpath such as GitHub Pages

Both default to `https://shop.laguuniin.fi` when unset.

`BASE_PATH` defaults to `/` when unset.

Fixture capture uses the native Node.js `fetch` runtime and does not rely on browser automation.

## Getting started

```sh
mise install
mise exec -- pnpm install
mise exec -- pnpm dev
```

## Verification commands

```sh
mise exec -- pnpm lint
mise exec -- pnpm test
mise exec -- pnpm build
```
