import type {
  BookingCheckoutResult,
  BookingCodeValidationResult,
  BookingFlowFailure,
  BookingFlowResult,
  BookingRequest,
} from '../../domain/booking'
import type { LaguuniApi } from '../../lib/api/laguuni-api'
import type { Diagnostics } from '../diagnostics/logs'
import { createBookingDiagnosticsReporter } from './booking-diagnostics'
import { validateBookingProfile } from './booking-validation'

export type BookingService = {
  book(request: BookingRequest): Promise<BookingFlowResult>
}

type BookingServiceOptions = {
  api: LaguuniApi
  diagnostics?: Pick<Diagnostics, 'append'>
}

export class DefaultBookingService implements BookingService {
  readonly #api: LaguuniApi
  readonly #diagnostics: Pick<Diagnostics, 'append'>

  constructor({ api, diagnostics = NOOP_DIAGNOSTICS }: BookingServiceOptions) {
    this.#api = api
    this.#diagnostics = diagnostics
  }

  async book({
    code,
    profile,
    selection,
  }: BookingRequest): Promise<BookingFlowResult> {
    const normalizedCode = code?.trim()
    const diagnosticsReporter = createBookingDiagnosticsReporter(
      this.#diagnostics,
    )
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

      const checkoutResult = await this.#api.submitCheckout({
        basketToken,
        observePaymentRedirect: (redirectUrl) => {
          diagnosticsReporter.recordCheckoutRedirectObserved(redirectUrl)
        },
        observeResponse: (observation) => {
          diagnosticsReporter.recordCheckoutResponseObserved(observation)
        },
        paymentMethod: basketPricing.totalDueCents === 0 ? 'cash' : 'mobilepay',
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

const NOOP_DIAGNOSTICS: Pick<Diagnostics, 'append'> = {
  append() {},
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
