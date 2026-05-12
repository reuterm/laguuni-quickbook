import type {
  BookingCodeValidationResult,
  BookingFlowFailure,
  BookingFlowResult,
  BookingSlotSelection,
} from '../../domain/booking'
import type { CheckoutResponseObservation } from '../../lib/api/booking-contracts'
import type { DiagnosticsTrace } from '../diagnostics/logs'

type DiagnosticAppender = Pick<DiagnosticsTrace, 'append'>

export type BookingDiagnosticsReporter = {
  recordBasketCreated(): void
  recordBasketReleaseFailed(): void
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
  recordReservationAdded(selection: BookingSlotSelection): void
  recordStarted(selection: BookingSlotSelection, hasCode: boolean): void
  recordUnexpectedError(selection: BookingSlotSelection): void
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
    recordBasketReleaseFailed() {
      diagnostics.append({
        event: 'booking.basket_release_failed',
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
    recordUnexpectedError(selection: BookingSlotSelection) {
      diagnostics.append({
        data: {
          errorCode: 'unexpected-error',
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
