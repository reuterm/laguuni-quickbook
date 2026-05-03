# Laguuni Quickbook

A mobile-first browser app for quickly booking Laguuni wakeboarding slots.

## Docs

- Product spec: [`docs/specs/product.md`](docs/specs/product.md)
- Technical direction: [`docs/adrs/001-technical-direction.md`](docs/adrs/001-technical-direction.md)
- Walking skeleton plan: [`docs/plans/001-walking-skeleton.md`](docs/plans/001-walking-skeleton.md)

## Tooling

This repository uses `mise` to manage tool versions and `pnpm` for package management.

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
