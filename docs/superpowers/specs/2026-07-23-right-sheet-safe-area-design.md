# Right-Side Sheet Safe-Area Clearance

## Goal

Keep every right-side sheet's top controls below the phone menu bar when the app runs as an installed standalone app.

## Root Cause

The application page applies `safe-area-standalone-top`, which adds `env(safe-area-inset-top)` plus 1.25rem of top clearance. Right-side sheets render in a portal and do not inherit that page utility. Their close controls can therefore be placed under the device menu bar.

## Design

Add the same top safe-area calculation to the shared right-side `SheetContent` variant. The added clearance applies to all right-side sheets, including sheets that render a custom close control. Other sheet sides retain their existing layout.

At the `sm` breakpoint, the existing standard sheet padding remains in effect, preserving desktop layout.

## Testing

Extend the shared sheet component test to assert that a right-side sheet carries the top safe-area clearance utility. Run the focused sheet test and the full test suite.

## Scope

This change is limited to the shared right-side sheet layout and its test coverage. No settings-specific override or changes to other sheet variants are required.
