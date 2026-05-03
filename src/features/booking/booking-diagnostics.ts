import type {
  BookingCodeValidationResult,
  BookingFlowFailure,
  BookingFlowResult,
  BookingSlotSelection,
} from '../../domain/booking'
import type { Diagnostics } from '../diagnostics/logs'

type DiagnosticAppender = Pick<Diagnostics, 'append'>

export type BookingDiagnosticsReporter = {
  recordBasketCreated(): void
  recordCheckoutCompleted(result: BookingFlowResult): void
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
    recordCheckoutCompleted(result: BookingFlowResult) {
      diagnostics.append({
        event: 'booking.checkout_completed',
        fields: {
          errorCode: result.status === 'failed' ? result.errorCode : null,
          hasRedirect:
            result.status === 'payment_required' && result.redirectUrl !== null,
          outcome: result.status,
          step: result.status === 'failed' ? result.step : null,
        },
      })
    },
    recordCodeAccepted(
      result: Extract<BookingCodeValidationResult, { status: 'accepted' }>,
    ) {
      diagnostics.append({
        event: 'booking.code_accepted',
        fields: {
          remainingBalanceCents: result.remainingBalanceCents,
          source: result.source,
        },
      })
    },
    recordCodeInvalid(
      result: Extract<BookingCodeValidationResult, { status: 'invalid' }>,
    ) {
      diagnostics.append({
        event: 'booking.code_invalid',
        fields: {
          errorCode: result.errorCode,
        },
      })
    },
    recordProfileInvalid(
      failure: BookingFlowFailure,
      missingFields: readonly string[],
      hasCode: boolean,
    ) {
      diagnostics.append({
        event: 'booking.profile_invalid',
        fields: {
          errorCode: failure.errorCode,
          hasCode,
          missingFields: missingFields.join(','),
        },
      })
    },
    recordReservationAdded(selection: BookingSlotSelection) {
      diagnostics.append({
        event: 'booking.reservation_added',
        fields: {
          cableId: selection.cableId,
        },
      })
    },
    recordStarted(selection: BookingSlotSelection, hasCode: boolean) {
      diagnostics.append({
        event: 'booking.started',
        fields: {
          cableId: selection.cableId,
          date: selection.date,
          endTime: selection.endTime,
          hasCode,
          startTime: selection.startTime,
        },
      })
    },
    recordUnexpectedError(selection: BookingSlotSelection) {
      diagnostics.append({
        event: 'booking.unexpected_error',
        fields: {
          errorCode: 'unexpected-error',
          selectionDate: selection.date,
          selectionStartTime: selection.startTime,
        },
      })
    },
  }
}
