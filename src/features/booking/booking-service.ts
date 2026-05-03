import type { BookingRequest, BookingResult } from '../../domain/booking'
import type { LaguuniApi } from '../../lib/api/laguuni-api'

export type BookingService = {
  book(request: BookingRequest): Promise<BookingResult>
}

type BookingServiceOptions = {
  api: LaguuniApi
}

export class DefaultBookingService implements BookingService {
  readonly #api: LaguuniApi

  constructor({ api }: BookingServiceOptions) {
    this.#api = api
  }

  async book({
    code,
    profile,
    selection,
  }: BookingRequest): Promise<BookingResult> {
    const basketToken = await this.#api.createBasket()

    await this.#api.addReservationToBasket({
      basketToken,
      selection,
    })

    const normalizedCode = code?.trim()

    if (normalizedCode) {
      const lookupResult = await this.#api.lookupCode({
        basketToken,
        code: normalizedCode,
      })

      if (lookupResult.status === 'invalid') {
        return {
          reason: lookupResult.errorCode ?? 'invalid-code',
          status: 'failed',
        }
      }
    }

    return this.#api.submitCheckout({
      basketToken,
      profile,
    })
  }
}
