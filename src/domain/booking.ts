import type { CableId } from './cable'

export type BasketToken = string

export type BookingSelection = {
  cableId: CableId
  productId: string
  date: string
  startTime: string
  endTime: string
  count: 1
  resourceCount: 1
  reservationCount: 1
}

export type BookingProfile = {
  email: string
  name: string
  phone: string
  paymentMethod: 'bambora'
  termsAccepted: true
}

export type CodeLookupSource = 'valuecard' | 'discount' | 'voucher'

export type AcceptedCodePayload = {
  amount?: string | undefined
  balance?: number | string | undefined
  code?: string | undefined
  remainingBalanceCents?: number | string | undefined
  remainingValue?: string | undefined
  status: 'ok'
}

export type InvalidCodePayload = {
  errorCode?: string | undefined
  errorMessage?: string | undefined
  status: 'error'
}

export type CodeLookupPayload = AcceptedCodePayload | InvalidCodePayload

export type CodeLookupResult =
  | {
      status: 'invalid'
      errorCode: string | null
    }
  | {
      status: 'accepted'
      payload: AcceptedCodePayload
      remainingBalanceCents: number | null
      source: CodeLookupSource
    }

export type BookingResult =
  | {
      orderId: string | null
      status: 'success'
    }
  | {
      orderId: string | null
      redirectUrl: string | null
      status: 'payment_required'
    }
  | {
      reason: string
      status: 'failed'
    }

export type BookingRequest = {
  code?: string | null
  profile: BookingProfile
  selection: BookingSelection
}
