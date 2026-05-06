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
  ): Promise<BookingFlowResult>
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
  ): Promise<BookingFlowResult> {
    const normalizedCode = code?.trim()
    const diagnosticsReporter = createBookingDiagnosticsReporter(diagnostics)
    const profileValidation = validateBookingProfile(profile)

    if (profileValidation.status === 'invalid') {
      diagnosticsReporter.recordProfileInvalid(
        profileValidation.failure,
        profileValidation.missingFields,
        Boolean(normalizedCode),
      )

      return profileValidation.failure
    }

    diagnosticsReporter.recordStarted(selection, Boolean(normalizedCode))

    try {
      const basketToken = await this.#api.createBasket()
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

          return mapInvalidCodeLookupToFailure(lookupResult)
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

      return bookingResult
    } catch (error) {
      diagnosticsReporter.recordUnexpectedError(selection)
      throw error
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
