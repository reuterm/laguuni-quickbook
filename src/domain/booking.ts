import type { LocalDateString } from '../lib/date'
import type { CableId } from './cable'

export type BookingSlotSelection = {
  cableId: CableId
  date: LocalDateString
  endTime: string
  startTime: string
}

export type BookingProfile = {
  email: string
  name: string
  phone: string
}

export type BookingCodeSource = 'discount'

export type BookingCodeValidationResult =
  | {
      remainingBalanceCents: number | null
      source: BookingCodeSource
      status: 'accepted'
    }
  | {
      errorCode: string | null
      errorMessage: string | null
      status: 'invalid'
    }

export type BookingCheckoutFailure = {
  errorCode: string | null
  message: string
  status: 'failed'
}

type BookingCheckoutSuccess = {
  orderIdentifier: string | null
  status: 'success'
}

type BookingCheckoutPaymentRequired = {
  orderIdentifier: string | null
  redirectUrl: string | null
  status: 'payment_required'
}

export type BookingCheckoutResult =
  | BookingCheckoutFailure
  | BookingCheckoutPaymentRequired
  | BookingCheckoutSuccess

export type BookingFailureStep = 'checkout' | 'code' | 'profile' | 'unexpected'

export type BookingFlowFailure = BookingCheckoutFailure & {
  step: BookingFailureStep
}

export type BookingFlowResult =
  | BookingCheckoutPaymentRequired
  | BookingCheckoutSuccess
  | BookingFlowFailure

export type BookingRequest = {
  code?: string | null
  profile: BookingProfile
  selection: BookingSlotSelection
}
