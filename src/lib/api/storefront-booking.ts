export type BasketToken = string

export type AcceptedCodePayload = {
  amount?: string | undefined
  balance?: number | string | undefined
  code?: string | undefined
  remainingBalanceCents?: number | string | undefined
  remainingValue?: string | undefined
  status?: 'ok' | undefined
}

export type InvalidCodePayload = {
  errorCode?: string | undefined
  errorMessage?: string | undefined
  status: 'error'
}

export type CodeLookupPayload = AcceptedCodePayload | InvalidCodePayload

export type BasketItemPayload = {
  discount_id?: number | string | null | undefined
  discountedprice?: number | string | null | undefined
  price?: number | string | null | undefined
}
