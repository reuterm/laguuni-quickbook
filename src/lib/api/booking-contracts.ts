import type { BookingProfile, BookingSlotSelection } from '../../domain/booking'
import type { BasketToken } from './storefront-booking'

export type AddReservationResponse = {
  basket: string
  itemId: string
  status: 'ok'
}

export type LookupCodeArgs = {
  basketToken: BasketToken
  code: string
}

export type AddReservationArgs = {
  basketToken: BasketToken
  selection: BookingSlotSelection
}

export type SubmitCheckoutArgs = {
  basketToken: BasketToken
  profile: BookingProfile
}
