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

type ReservationRelease = {
  release(): Promise<void>
}

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
    { code, profile, selection }: BookingRequest,
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

    diagnosticsReporter.recordStarted(selection, Boolean(normalizedCode))

    try {
      const basketToken = await this.#api.createBasket()
      reservationRelease = createReservationRelease({
        api: this.#api,
        basketToken,
        onError: () => {
          diagnosticsReporter.recordBasketReleaseFailed()
        },
      })
      diagnosticsReporter.recordBasketCreated()

      await this.#api.addReservationToBasket({
        basketToken,
        selection,
      })
      diagnosticsReporter.recordReservationAdded(selection)

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

      return createBookingSubmission({
        reservationRelease:
          bookingResult.status === 'success'
            ? createNoopReservationRelease()
            : reservationRelease,
        result: bookingResult,
      })
    } catch (error) {
      diagnosticsReporter.recordUnexpectedError(selection)

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
      await reservationRelease.release()
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

  return {
    async release() {
      if (releasePromise !== null) {
        return releasePromise
      }

      releasePromise = api.deleteBasket(basketToken).catch(() => {
        onError()
      })

      return releasePromise
    },
  }
}

function createNoopReservationRelease(): ReservationRelease {
  return {
    async release() {},
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'The booking flow failed unexpectedly.'
}
