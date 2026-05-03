# Laguuni Quickbook product specification

## Status

Draft

## Spec version

0.1

## Scope

V1

## 1. Summary

Laguuni Quickbook is a mobile-first browser application for quickly booking Laguuni wakeboarding slots.

It is intended to be used as an installable web app on **iOS** and **Android**. Users open it in their browser, add it to their home screen if they want to, save their booking details locally on their own device, and use it to book available slots with minimal manual input.

Version 1 is intentionally narrow:

- personal-use tool
- one person only
- one-hour bookings only
- direct slot selection from an availability overview

## 2. Goals

- Reduce the manual steps required to book a slot.
- Keep personal data on the user's own device.
- Provide a fast mobile experience for browsing and booking available slots.
- Show enough availability detail for users to make an informed booking choice.

## 3. Non-goals for V1

- centralized user accounts
- server-side user data storage
- syncing settings across devices
- multi-person bookings
- variable duration bookings
- UI automation as a production dependency

## 4. Target platforms

- Mobile Safari on iPhone
- Chrome on Android
- Installable as a home-screen web app where supported

Desktop support is allowed but is not the design priority.

## 5. User data and privacy model

The application stores user-entered booking data **locally in the browser** on the user's device.

V1 stores:

- name
- phone
- email
- season pass code
- default cable

The application must not require a project-managed backend for storing personal data.

## 6. Usage model

V1 is a **personal quick-booking tool**, not a general booking client.

The following rules are fixed in V1:

- reservation count is always `1`
- booking duration is always `1 hour`
- the user must explicitly choose a slot from the UI
- the application books exactly the selected slot

There is no UI in V1 for changing participant count or duration.

## 7. Supported cables

V1 supports:

- Pro
- Easy
- Hietsu

Known booking product mapping:

- Pro -> `6`
- Easy -> `7`
- Hietsu -> `157`

## 8. Core product behavior

### 8.1 Availability overview

The main screen must present an overview of currently bookable slots together with how full those slots are.

The overview means:

1. Users must have access to all supported cables.
2. The application may remember a **default cable** as a convenience.
3. If a default cable is saved, it only affects the initial cable in scope when the app opens.
4. The user must be able to change the cable in scope before booking.
5. The screen shows upcoming bookable dates for the cable currently in scope.
6. Each date shows its available one-hour slots in chronological order.
7. Each slot row shows:
   - start time
   - free capacity / fullness for that slot
   - a **Book** action

Example slot representation:

| Time  | Availability | Action |
| ----- | ------------ | ------ |
| 15:00 | 3/4 free     | Book   |
| 16:00 | 4/4 free     | Book   |
| 17:00 | 1/4 free     | Book   |

If no bookable slots are available for the selected cable in the currently loaded range, the UI must show a clear empty state.

### 8.2 Cable access

- Users must be able to browse and book all supported cables.
- The default cable is a convenience setting, not a restriction.
- Booking always uses the cable currently in scope at booking time.

### 8.3 Booking flow

When the user taps **Book** on a slot, the app must:

1. create or recover a basket
2. add the selected one-hour, one-person reservation to that basket
3. apply the locally stored code if present
4. submit checkout using the locally stored profile
5. redirect to payment only if there is remaining balance to pay

If the booking can be completed without payment, the app should show a clear success result instead of sending the user into an unnecessary payment flow.

## 9. Screens

### 9.1 Availability screen

Required elements:

- way to access and switch between supported cables
- upcoming availability grouped by date
- slot rows with time, fullness, and Book action
- entry point to settings

### 9.2 Settings screen

Required fields:

- name
- phone
- email
- season pass code
- optional default cable

Settings are saved locally on the device.

### 9.3 Booking result states

The app must handle and show:

- booking in progress
- booking success
- booking failed
- payment required

## 10. Technical direction

- The app is a browser client that talks directly to the Laguuni storefront API.
- No project-managed backend is required for V1 booking.
- The application should be structured so it can later become a polished PWA, but PWA polish is secondary to the core booking flow.

## 11. Out-of-scope follow-up ideas

These are explicitly later-phase ideas, not V1 requirements:

- favorites or presets beyond default cable
- locally stored booking history
- richer filters
- notifications
- broader support for other booking shapes
