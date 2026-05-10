import type {
  BookingCheckoutResult,
  BookingCodeValidationResult,
  BookingFlowFailure,
  BookingFlowResult,
  BookingRequest,
} from '../../domain/booking'
import type { LaguuniApi } from '../../lib/api/laguuni-api'
import type { DiagnosticsTrace } from '../diagnostics/logs'
import {
  type BookingDiagnosticsReporter,
  type BookingUnexpectedErrorPhase,
  createBookingDiagnosticsReporter,
} from './booking-diagnostics'
import { validateBookingProfile } from './booking-validation'

export type BookingService = {
  book(
    request: BookingRequest,
    diagnostics: DiagnosticsTrace,
  ): Promise<BookingSession>
}

type ReservationRelease = {
  // Best-effort cleanup: diagnostics capture failures, callers do not branch on them.
  release(): Promise<void>
}

export type BookingSession = {
  result: BookingFlowResult
  trace: DiagnosticsTrace
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
  ): Promise<BookingSession> {
    const normalizedCode = code?.trim()
    const diagnosticsReporter = createBookingDiagnosticsReporter(diagnostics)
    const profileValidation = validateBookingProfile(profile)
    let reservationRelease: ReservationRelease = createNoopReservationRelease()

    if (profileValidation.status === 'invalid') {
      diagnosticsReporter.recordProfileInvalid(
        profileValidation.failure,
        profileValidation.missingFields,
        Boolean(normalizedCode),
      )

      return createBookingSession({
        reservationRelease,
        result: profileValidation.failure,
        trace: diagnostics,
      })
    }

    diagnosticsReporter.recordStarted(selection, Boolean(normalizedCode))

    try {
      const basketToken = await this.#createBasket()
      reservationRelease = createReservationRelease({
        api: this.#api,
        basketToken,
        diagnosticsReporter,
      })
      diagnosticsReporter.recordBasketCreated()

      await this.#addReservationToBasket(basketToken, selection)
      diagnosticsReporter.recordReservationAdded(selection)

      if (normalizedCode) {
        const lookupResult = await this.#lookupCode(normalizedCode)

        if (lookupResult.status === 'invalid') {
          diagnosticsReporter.recordCodeInvalid(lookupResult)

          return createBookingSession({
            reservationRelease,
            result: mapInvalidCodeLookupToFailure(lookupResult),
            trace: diagnostics,
          })
        }

        await this.#applyCodeToBasket(basketToken, normalizedCode)
        diagnosticsReporter.recordCodeApplied(lookupResult.source)

        diagnosticsReporter.recordCodeAccepted(lookupResult)
      }

      const basketPricing = await this.#loadBasketPricingSummary(basketToken)
      const paymentMethod =
        basketPricing.totalDueCents === 0 ? 'cash' : 'mobilepay'

      diagnosticsReporter.recordCheckoutPlan({
        paymentMethod,
        totalDueCents: basketPricing.totalDueCents,
      })

      const checkoutResult = await this.#submitCheckout({
        basketToken,
        diagnosticsReporter,
        paymentMethod,
        profile: profileValidation.profile,
      })
      const bookingResult =
        mapCheckoutSubmissionToBookingFlowResult(checkoutResult)

      diagnosticsReporter.recordCheckoutCompleted(bookingResult)

      return createBookingSession({
        reservationRelease:
          bookingResult.status === 'success'
            ? createNoopReservationRelease()
            : reservationRelease,
        result: bookingResult,
        trace: diagnostics,
      })
    } catch (error) {
      diagnosticsReporter.recordUnexpectedError(
        selection,
        readBookingExecutionPhase(error),
      )

      return createBookingSession({
        reservationRelease,
        result: {
          errorCode: 'unexpected-error',
          message: getErrorMessage(error),
          status: 'failed',
          step: 'unexpected',
        },
        trace: diagnostics,
      })
    }
  }

  async #createBasket(): Promise<string> {
    try {
      return await this.#api.createBasket()
    } catch (error) {
      throw new BookingExecutionError('create_basket', error)
    }
  }

  async #addReservationToBasket(
    basketToken: string,
    selection: BookingRequest['selection'],
  ): Promise<void> {
    try {
      await this.#api.addReservationToBasket({
        basketToken,
        selection,
      })
    } catch (error) {
      throw new BookingExecutionError('add_reservation', error)
    }
  }

  async #lookupCode(code: string): Promise<BookingCodeValidationResult> {
    try {
      return await this.#api.lookupCode({ code })
    } catch (error) {
      throw new BookingExecutionError('lookup_code', error)
    }
  }

  async #applyCodeToBasket(basketToken: string, code: string): Promise<void> {
    try {
      await this.#api.applyCodeToBasket({
        basketToken,
        code,
      })
    } catch (error) {
      throw new BookingExecutionError('apply_code', error)
    }
  }

  async #loadBasketPricingSummary(basketToken: string): Promise<{
    totalDueCents: number
  }> {
    try {
      return await this.#api.loadBasketPricingSummary(basketToken)
    } catch (error) {
      throw new BookingExecutionError('load_basket_pricing', error)
    }
  }

  async #submitCheckout({
    basketToken,
    diagnosticsReporter,
    paymentMethod,
    profile,
  }: {
    basketToken: string
    diagnosticsReporter: BookingDiagnosticsReporter
    paymentMethod: 'cash' | 'mobilepay'
    profile: BookingRequest['profile']
  }): Promise<BookingCheckoutResult> {
    try {
      return await this.#api.submitCheckout({
        basketToken,
        observers: {
          cashCheckoutStep: (step) => {
            diagnosticsReporter.recordCashCheckoutStep(step)
          },
          paymentRedirect: (redirectUrl) => {
            diagnosticsReporter.recordCheckoutRedirectObserved(redirectUrl)
          },
          response: (observation) => {
            diagnosticsReporter.recordCheckoutResponseObserved(observation)
          },
        },
        paymentMethod,
        profile,
      })
    } catch (error) {
      throw new BookingExecutionError('submit_checkout', error)
    }
  }
}

export class BookingExecutionError extends Error {
  readonly phase: BookingUnexpectedErrorPhase

  constructor(phase: BookingUnexpectedErrorPhase, cause: unknown) {
    super(getErrorMessage(cause), { cause })
    this.name = 'BookingExecutionError'
    this.phase = phase
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

function createBookingSession({
  reservationRelease,
  result,
  trace,
}: {
  reservationRelease: ReservationRelease
  result: BookingFlowResult
  trace: DiagnosticsTrace
}): BookingSession {
  return {
    async releaseReservation() {
      await reservationRelease.release()
    },
    result,
    trace,
  }
}

function createReservationRelease({
  api,
  basketToken,
  diagnosticsReporter,
}: {
  api: LaguuniApi
  basketToken: string
  diagnosticsReporter: BookingDiagnosticsReporter
}): ReservationRelease {
  let releasePromise: Promise<void> | null = null

  return {
    async release() {
      if (releasePromise !== null) {
        return releasePromise
      }

      diagnosticsReporter.recordBasketCleanupRequested()

      releasePromise = api
        .deleteBasket(basketToken)
        .then(() => {
          diagnosticsReporter.recordBasketCleanedUp()
        })
        .catch(() => {
          diagnosticsReporter.recordBasketCleanupFailed()
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
  if (error instanceof BookingExecutionError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'The booking flow failed unexpectedly.'
}

function readBookingExecutionPhase(
  error: unknown,
): BookingUnexpectedErrorPhase {
  if (error instanceof BookingExecutionError) {
    return error.phase
  }

  return 'submit_checkout'
}
