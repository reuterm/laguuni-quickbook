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
  type ApplyCodeArgs,
  addReservationToBasket as addReservationToBasketRequest,
  applyCodeToBasket as applyCodeToBasketRequest,
  type BasketPricingSummary,
  createBasket as createBasketRequest,
  type LookupCodeArgs,
  loadBasketPricingSummary as loadBasketPricingSummaryRequest,
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
  applyCodeToBasket(args: ApplyCodeArgs): Promise<void>
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
  loadBasketPricingSummary(
    basketToken: BasketToken,
  ): Promise<BasketPricingSummary>
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

  async applyCodeToBasket({ basketToken, code }: ApplyCodeArgs): Promise<void> {
    return applyCodeToBasketRequest(this.#client, {
      basketToken,
      code,
    })
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
    code,
  }: LookupCodeArgs): Promise<BookingCodeValidationResult> {
    return lookupCodeRequest(this.#client, {
      code,
    })
  }

  async loadBasketPricingSummary(
    basketToken: BasketToken,
  ): Promise<BasketPricingSummary> {
    return loadBasketPricingSummaryRequest(this.#client, basketToken)
  }

  async submitCheckout({
    basketToken,
    observeCashCheckoutStep,
    observePaymentRedirect,
    observeResponse,
    paymentMethod,
    profile,
  }: SubmitCheckoutArgs): Promise<BookingCheckoutResult> {
    return submitCheckoutRequest(this.#client, {
      basketToken,
      ...(observeCashCheckoutStep ? { observeCashCheckoutStep } : {}),
      ...(observePaymentRedirect ? { observePaymentRedirect } : {}),
      profile,
      paymentMethod,
      ...(observeResponse ? { observeResponse } : {}),
    })
  }
}
