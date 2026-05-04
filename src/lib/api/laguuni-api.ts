import type {
  BookingCheckoutResult,
  BookingCodeValidationResult,
  BookingSlotSelection,
} from '../../domain/booking'
import type { CableId } from '../../domain/cable'
import type { AvailableDate, DailyAvailabilityWindow } from '../../domain/slot'
import {
  getAvailableDates as loadAvailableDates,
  getDailyAvailabilityWindow as loadDailyAvailabilityWindow,
} from './availability-api'
import {
  type AddReservationArgs,
  type AddReservationResponse,
  addReservationToBasket as addReservationToBasketRequest,
  createBasket as createBasketRequest,
  type LookupCodeArgs,
  lookupCode as lookupCodeRequest,
  type SubmitCheckoutArgs,
  submitCheckout as submitCheckoutRequest,
} from './booking-api'
import type { HttpClient } from './client'
import type { BasketToken } from './storefront-booking'

export type LaguuniApi = {
  addReservationToBasket(args: {
    basketToken: BasketToken
    selection: BookingSlotSelection
  }): Promise<AddReservationResponse>
  createBasket(): Promise<BasketToken>
  getAvailableDates(
    cableId: CableId,
    anchorDate: string,
  ): Promise<readonly AvailableDate[]>
  getDailyAvailabilityWindow(
    cableId: CableId,
    date: string,
  ): Promise<DailyAvailabilityWindow>
  lookupCode(args: LookupCodeArgs): Promise<BookingCodeValidationResult>
  submitCheckout(args: SubmitCheckoutArgs): Promise<BookingCheckoutResult>
}

export type LaguuniApiClientOptions = {
  client: HttpClient
}

export class LaguuniApiClient implements LaguuniApi {
  readonly #client: HttpClient

  constructor({ client }: LaguuniApiClientOptions) {
    this.#client = client
  }

  async addReservationToBasket({
    basketToken,
    selection,
  }: AddReservationArgs): Promise<AddReservationResponse> {
    return addReservationToBasketRequest(this.#client, {
      basketToken,
      selection,
    })
  }

  async createBasket(): Promise<BasketToken> {
    return createBasketRequest(this.#client)
  }

  async getAvailableDates(
    cableId: CableId,
    anchorDate: string,
  ): Promise<readonly AvailableDate[]> {
    return loadAvailableDates(this.#client, cableId, anchorDate)
  }

  async getDailyAvailabilityWindow(
    cableId: CableId,
    date: string,
  ): Promise<DailyAvailabilityWindow> {
    return loadDailyAvailabilityWindow(this.#client, cableId, date)
  }

  async lookupCode({
    basketToken,
    code,
  }: LookupCodeArgs): Promise<BookingCodeValidationResult> {
    return lookupCodeRequest(this.#client, {
      basketToken,
      code,
    })
  }

  async submitCheckout({
    basketToken,
    observeResponse,
    profile,
  }: SubmitCheckoutArgs): Promise<BookingCheckoutResult> {
    return submitCheckoutRequest(this.#client, {
      basketToken,
      profile,
      ...(observeResponse ? { observeResponse } : {}),
    })
  }
}
