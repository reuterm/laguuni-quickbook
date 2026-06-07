import type { BookingProfile, BookingSlotSelection } from '../../domain/booking'
import type { BasketToken } from './storefront-booking'

export type AddReservationResponse = {
  itemId: string
}

export type ApplyCodeArgs = {
  basketToken: BasketToken
  code: string
}

export type BasketPricingSummary = {
  totalDueCents: number
}

export type CheckoutPaymentMethod = 'cash' | 'mobilepay'

export type CheckoutResponseFieldKind =
  | 'boolean'
  | 'missing'
  | 'null'
  | 'number'
  | 'other'
  | 'string'

export type CheckoutResponseObservation = {
  hasErrorCode: boolean
  hasErrorMessage: boolean
  normalizedStatus: 'error' | 'ok'
  orderFieldKind: CheckoutResponseFieldKind
  paymentRequiredFieldKind: CheckoutResponseFieldKind
  rawStatus: string | null
  redirectUrlFieldKind: CheckoutResponseFieldKind
  responseKeys: string
}

export type LookupCodeArgs = {
  code: string
}

export type AddReservationArgs = {
  basketToken: BasketToken
  selection: BookingSlotSelection
}

export type SubmitCheckoutArgs = {
  basketToken: BasketToken
  observeCashCheckoutStep?: (
    step: 'cashreturn_completed' | 'order_details_loaded',
  ) => void
  observePaymentCancelStep?: (step: 'mobilepayreturn_completed') => void
  observeResponse?: (observation: CheckoutResponseObservation) => void
  observePaymentRedirect?: (redirectUrl: string | null) => void
  paymentMethod: CheckoutPaymentMethod
  profile: BookingProfile
}
