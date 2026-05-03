export type BasketToken = string

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
