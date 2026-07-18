# Always-on calendar action design

## Decision

The add-to-calendar action is always shown after a successful booking. It is
not a user preference and has no persisted setting or feature flag.

## Scope

- Remove `calendarExportEnabled` from the settings domain model, defaults,
  local-storage serialization and validation, and the settings screen.
- Successful booking results always receive the calendar action.
- Keep calendar export best-effort: errors remain inline feedback and never
  change booking success, sheet dismissal, or follow-up booking work.
- Remove stories and test states that model calendar export as disabled or
  enabled by settings. Retain coverage for the default action and its failure
  handling.

## Data handling

The feature has not shipped. Existing saved `calendarExportEnabled` properties
are not migrated or specially handled; they are treated as absent by the
current settings model.

## Verification

Run the affected unit and component tests, TypeScript checks, lint, and the
production build.
