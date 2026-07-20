import type {
  BookingCheckoutResult,
  BookingCodeValidationResult,
  BookingFlowFailure,
  BookingFlowResult,
  BookingRequest,
} from '../../domain/booking'
import type { LaguuniApi } from '../../lib/api/laguuni-api'
import type { DiagnosticsTrace } from '../diagnostics/logs'
import { createBookingDiagnosticsReporter } from './booking-diagnostics'
import { validateBookingProfile } from './booking-validation'

export type BookingService = {
  book(
    request: BookingRequest,
    diagnostics: DiagnosticsTrace,
  ): Promise<BookingSubmission>
}

type ReservationRelease = () => Promise<void>

export type BookingSubmission = {
  result: BookingFlowResult
  releaseReservation(): Promise<void>
}

type BookingServiceOptions = {
  api: LaguuniApi
}

export class DefaultBookingService implements BookingService {
  readonly #api: LaguuniApi

  constructor({ api }: BookingServiceOptions) {
    this.#api = api
  }

  async book(
    { code, profile, selections }: BookingRequest,
    diagnostics: DiagnosticsTrace,
  ): Promise<BookingSubmission> {
    const normalizedCode = code?.trim()
    const diagnosticsReporter = createBookingDiagnosticsReporter(diagnostics)
    const profileValidation = validateBookingProfile(profile)
    let reservationRelease = createNoopReservationRelease()

    if (profileValidation.status === 'invalid') {
      diagnosticsReporter.recordProfileInvalid(
        profileValidation.failure,
        profileValidation.missingFields,
        Boolean(normalizedCode),
      )

      return createBookingSubmission({
        reservationRelease,
        result: profileValidation.failure,
      })
    }

    if (selections.length === 0) {
      return createBookingSubmission({
        reservationRelease,
        result: {
          errorCode: 'missing-selections',
          message: 'At least one booking slot selection is required.',
          status: 'failed',
          step: 'unexpected',
        },
      })
    }

    const selectedDates = new Set(selections.map((selection) => selection.date))

    if (selectedDates.size !== selections.length) {
      return createBookingSubmission({
        reservationRelease,
        result: {
          errorCode: 'duplicate-date-selections',
          message: 'Only one booking slot can be selected per day.',
          status: 'failed',
          step: 'unexpected',
        },
      })
    }

    diagnosticsReporter.recordStarted(selections, Boolean(normalizedCode))

    try {
      let basketToken: string

      try {
        basketToken = await this.#api.createBasket()
      } catch (error) {
        return createBookingSubmission({
          reservationRelease,
          result: {
            errorCode: 'reservation-unavailable',
            message: getErrorMessage(error),
            status: 'failed',
            step: 'reservation',
          },
        })
      }

      reservationRelease = createReservationRelease({
        api: this.#api,
        basketToken,
        onError: () => {
          diagnosticsReporter.recordBasketReleaseFailed()
        },
      })
      diagnosticsReporter.recordBasketCreated()

      for (const selection of selections) {
        try {
          await this.#api.addReservationToBasket({
            basketToken,
            selection,
          })
        } catch (error) {
          await reservationRelease()

          return createBookingSubmission({
            reservationRelease,
            result: {
              errorCode: 'reservation-unavailable',
              message: getErrorMessage(error),
              status: 'failed',
              step: 'reservation',
            },
          })
        }
        diagnosticsReporter.recordReservationAdded(selection)
      }

      if (normalizedCode) {
        const lookupResult = await this.#api.lookupCode({
          code: normalizedCode,
        })

        if (lookupResult.status === 'invalid') {
          diagnosticsReporter.recordCodeInvalid(lookupResult)

          return createBookingSubmission({
            reservationRelease,
            result: mapInvalidCodeLookupToFailure(lookupResult),
          })
        }

        await this.#api.applyCodeToBasket({
          basketToken,
          code: normalizedCode,
        })
        diagnosticsReporter.recordCodeApplied(lookupResult.source)

        diagnosticsReporter.recordCodeAccepted(lookupResult)
      }

      const basketPricing =
        await this.#api.loadBasketPricingSummary(basketToken)
      const paymentMethod =
        basketPricing.totalDueCents === 0 ? 'cash' : 'mobilepay'

      diagnosticsReporter.recordCheckoutPlan({
        paymentMethod,
        totalDueCents: basketPricing.totalDueCents,
      })

      const checkoutResult = await this.#api.submitCheckout({
        basketToken,
        observeCashCheckoutStep: (step) => {
          diagnosticsReporter.recordCashCheckoutStep(step)
        },
        observePaymentRedirect: (redirectUrl) => {
          diagnosticsReporter.recordCheckoutRedirectObserved(redirectUrl)
        },
        observeResponse: (observation) => {
          diagnosticsReporter.recordCheckoutResponseObserved(observation)
        },
        paymentMethod,
        profile: profileValidation.profile,
      })
      const bookingResult =
        mapCheckoutSubmissionToBookingFlowResult(checkoutResult)

      diagnosticsReporter.recordCheckoutCompleted(bookingResult)

      if (bookingResult.status === 'payment_required') {
        reservationRelease = createPaymentRequiredReservationRelease({
          api: this.#api,
          basketToken,
          onError: () => {
            diagnosticsReporter.recordBasketReleaseFailed()
          },
          paymentToken: bookingResult.paymentToken,
        })
      }

      return createBookingSubmission({
        reservationRelease:
          bookingResult.status === 'success'
            ? createNoopReservationRelease()
            : reservationRelease,
        result: bookingResult,
      })
    } catch (error) {
      diagnosticsReporter.recordUnexpectedError(selections)

      return createBookingSubmission({
        reservationRelease,
        result: {
          errorCode: 'unexpected-error',
          message: getErrorMessage(error),
          status: 'failed',
          step: 'unexpected',
        },
      })
    }
  }
}

function mapCheckoutSubmissionToBookingFlowResult(
  result: BookingCheckoutResult,
): BookingFlowResult {
  if (result.status !== 'failed') {
    return result
  }

  return {
    ...result,
    step: 'checkout',
  }
}

function mapInvalidCodeLookupToFailure(
  result: Extract<BookingCodeValidationResult, { status: 'invalid' }>,
): BookingFlowFailure {
  return {
    errorCode: result.errorCode,
    message: result.errorMessage ?? 'Saved season pass code was not accepted.',
    status: 'failed',
    step: 'code',
  }
}

function createBookingSubmission({
  reservationRelease,
  result,
}: {
  reservationRelease: ReservationRelease
  result: BookingFlowResult
}): BookingSubmission {
  return {
    async releaseReservation() {
      await reservationRelease()
    },
    result,
  }
}

function createReservationRelease({
  api,
  basketToken,
  onError,
}: {
  api: LaguuniApi
  basketToken: string
  onError: () => void
}): ReservationRelease {
  let releasePromise: Promise<void> | null = null

  return async () => {
    if (releasePromise !== null) {
      return releasePromise
    }

    // Basket cleanup is best-effort. The storefront eventually reclaims
    // abandoned baskets, so callers should not block the user on delete
    // failures beyond recording diagnostics for later inspection.
    releasePromise = api.deleteBasket(basketToken).catch(() => {
      onError()
    })

    return releasePromise
  }
}

function createPaymentRequiredReservationRelease({
  api,
  basketToken,
  onError,
  paymentToken,
}: {
  api: LaguuniApi
  basketToken: string
  onError: () => void
  paymentToken: string | null
}): ReservationRelease {
  let releasePromise: Promise<void> | null = null

  return async () => {
    if (releasePromise !== null) {
      return releasePromise
    }

    releasePromise = (async () => {
      try {
        if (paymentToken !== null) {
          await api.cancelMobilePayCheckout(paymentToken)
        }

        await api.deleteBasket(basketToken)
      } catch {
        onError()
      }
    })()

    return releasePromise
  }
}

function createNoopReservationRelease(): ReservationRelease {
  return async () => {}
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'The booking flow failed unexpectedly.'
}
