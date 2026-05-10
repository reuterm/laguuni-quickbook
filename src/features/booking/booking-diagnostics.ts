import type {
  BookingCodeValidationResult,
  BookingFlowFailure,
  BookingFlowResult,
  BookingSlotSelection,
} from '../../domain/booking'
import type { CheckoutResponseObservation } from '../../lib/api/booking-contracts'
import type { DiagnosticsTrace } from '../diagnostics/logs'

type DiagnosticAppender = Pick<DiagnosticsTrace, 'append'>

export type BookingUnexpectedErrorPhase =
  | 'add_reservation'
  | 'apply_code'
  | 'create_basket'
  | 'load_basket_pricing'
  | 'lookup_code'
  | 'submit_checkout'

export type BookingDiagnosticsReporter = {
  recordBasketCreated(): void
  recordBasketCleanupFailed(): void
  recordBasketCleanupRequested(): void
  recordBasketCleanedUp(): void
  recordCheckoutPlan(plan: {
    paymentMethod: 'cash' | 'mobilepay'
    totalDueCents: number
  }): void
  recordCashCheckoutStep(
    step: 'cashreturn_completed' | 'order_details_loaded',
  ): void
  recordCheckoutCompleted(result: BookingFlowResult): void
  recordCheckoutRedirectObserved(redirectUrl: string | null): void
  recordCheckoutResponseObserved(observation: CheckoutResponseObservation): void
  recordCodeApplied(
    source: Extract<
      BookingCodeValidationResult,
      { status: 'accepted' }
    >['source'],
  ): void
  recordCodeAccepted(
    result: Extract<BookingCodeValidationResult, { status: 'accepted' }>,
  ): void
  recordCodeInvalid(
    result: Extract<BookingCodeValidationResult, { status: 'invalid' }>,
  ): void
  recordProfileInvalid(
    failure: BookingFlowFailure,
    missingFields: readonly string[],
    hasCode: boolean,
  ): void
  recordSheetDismissSideEffectFailed(options: {
    bookingTraceId: string
    effect: 'refresh_availability'
  }): void
  recordReservationAdded(selection: BookingSlotSelection): void
  recordStarted(selection: BookingSlotSelection, hasCode: boolean): void
  recordUnexpectedError(
    selection: BookingSlotSelection,
    phase: BookingUnexpectedErrorPhase,
  ): void
}

export function createBookingDiagnosticsReporter(
  diagnostics: DiagnosticAppender,
): BookingDiagnosticsReporter {
  return {
    recordBasketCreated() {
      diagnostics.append({
        event: 'booking.basket_created',
      })
    },
    recordBasketCleanupFailed() {
      diagnostics.append({
        event: 'booking.basket_cleanup_failed',
      })
    },
    recordBasketCleanupRequested() {
      diagnostics.append({
        event: 'booking.basket_cleanup_requested',
      })
    },
    recordBasketCleanedUp() {
      diagnostics.append({
        event: 'booking.basket_cleaned_up',
      })
    },
    recordCheckoutPlan(plan) {
      diagnostics.append({
        data: {
          paymentMethod: plan.paymentMethod,
          totalDueCents: plan.totalDueCents,
        },
        event: 'booking.checkout_planned',
      })
    },
    recordCashCheckoutStep(step) {
      diagnostics.append({
        data: {
          step,
        },
        event: 'booking.cash_checkout_step',
      })
    },
    recordCheckoutCompleted(result: BookingFlowResult) {
      diagnostics.append({
        data: {
          errorCode: result.status === 'failed' ? result.errorCode : null,
          hasRedirect:
            result.status === 'payment_required' && result.redirectUrl !== null,
          outcome: result.status,
          step: result.status === 'failed' ? result.step : null,
        },
        event: 'booking.checkout_completed',
      })
    },
    recordCheckoutRedirectObserved(redirectUrl) {
      const redirectParts = readRedirectParts(redirectUrl)

      diagnostics.append({
        data: {
          hasRedirect: redirectParts !== null,
          redirectHost: redirectParts?.host ?? null,
          redirectPath: redirectParts?.path ?? null,
        },
        event: 'booking.checkout_redirect_observed',
      })
    },
    recordCheckoutResponseObserved(observation: CheckoutResponseObservation) {
      diagnostics.append({
        data: {
          // Temporary: keep this to shape-only fields until the live checkout
          // response is captured and we know which artifacts are worth persisting.
          hasErrorCode: observation.hasErrorCode,
          hasErrorMessage: observation.hasErrorMessage,
          normalizedStatus: observation.normalizedStatus,
          orderFieldKind: observation.orderFieldKind,
          paymentRequiredFieldKind: observation.paymentRequiredFieldKind,
          rawStatus: observation.rawStatus,
          redirectUrlFieldKind: observation.redirectUrlFieldKind,
          responseKeys: observation.responseKeys,
        },
        event: 'booking.checkout_response_observed',
      })
    },
    recordCodeApplied(source) {
      diagnostics.append({
        data: {
          source,
        },
        event: 'booking.code_applied',
      })
    },
    recordCodeAccepted(
      result: Extract<BookingCodeValidationResult, { status: 'accepted' }>,
    ) {
      diagnostics.append({
        data: {
          remainingBalanceCents: result.remainingBalanceCents,
          source: result.source,
        },
        event: 'booking.code_accepted',
      })
    },
    recordCodeInvalid(
      result: Extract<BookingCodeValidationResult, { status: 'invalid' }>,
    ) {
      diagnostics.append({
        data: {
          errorCode: result.errorCode,
        },
        event: 'booking.code_invalid',
      })
    },
    recordProfileInvalid(
      failure: BookingFlowFailure,
      missingFields: readonly string[],
      hasCode: boolean,
    ) {
      diagnostics.append({
        data: {
          errorCode: failure.errorCode,
          hasCode,
          missingFields: missingFields.join(','),
        },
        event: 'booking.profile_invalid',
      })
    },
    recordSheetDismissSideEffectFailed({ bookingTraceId, effect }) {
      diagnostics.append({
        data: {
          bookingTraceId,
          effect,
        },
        event: 'booking.sheet_dismiss_side_effect_failed',
      })
    },
    recordReservationAdded(selection: BookingSlotSelection) {
      diagnostics.append({
        data: {
          cableId: selection.cableId,
        },
        event: 'booking.reservation_added',
      })
    },
    recordStarted(selection: BookingSlotSelection, hasCode: boolean) {
      diagnostics.append({
        data: {
          cableId: selection.cableId,
          date: selection.date,
          endTime: selection.endTime,
          hasCode,
          startTime: selection.startTime,
        },
        event: 'booking.started',
      })
    },
    recordUnexpectedError(
      selection: BookingSlotSelection,
      phase: BookingUnexpectedErrorPhase,
    ) {
      diagnostics.append({
        data: {
          errorCode: 'unexpected-error',
          phase,
          selectionDate: selection.date,
          selectionStartTime: selection.startTime,
        },
        event: 'booking.unexpected_error',
      })
    },
  }
}

function readRedirectParts(
  redirectUrl: string | null,
): { host: string; path: string } | null {
  if (redirectUrl === null) {
    return null
  }

  try {
    const parsedUrl = new URL(redirectUrl)

    return {
      host: parsedUrl.host,
      path: parsedUrl.pathname,
    }
  } catch {
    return {
      host: 'invalid-url',
      path: 'invalid-url',
    }
  }
}
