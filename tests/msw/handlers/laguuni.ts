import {
  createLaguuniApiHandlers,
  createLaguuniHandlerState,
  getDefaultLaguuniHandlerBaseUrl,
  resetLaguuniHandlerState as resetSharedLaguuniHandlerState,
} from './laguuni-core'

const laguuniHandlerState = createLaguuniHandlerState()

export function createLaguuniHandlers(
  baseUrl = getDefaultLaguuniHandlerBaseUrl(),
  options = {},
) {
  return createLaguuniApiHandlers(laguuniHandlerState, {
    baseUrl,
    ...options,
  })
}

export const laguuniHandlers = createLaguuniHandlers()

export function resetLaguuniHandlerState() {
  resetSharedLaguuniHandlerState(laguuniHandlerState)
}
