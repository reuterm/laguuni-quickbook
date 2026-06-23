import {
  createLaguuniHandlerState,
  createTestLaguuniHandlers,
  getDefaultLaguuniHandlerBaseUrl,
  resetLaguuniHandlerState as resetSharedLaguuniHandlerState,
} from './laguuni-core'

const laguuniHandlerState = createLaguuniHandlerState()

export const laguuniHandlers = createTestLaguuniHandlers(
  laguuniHandlerState,
  getDefaultLaguuniHandlerBaseUrl(),
)

export function createLaguuniHandlers(
  baseUrl = getDefaultLaguuniHandlerBaseUrl(),
  options = {},
) {
  return createTestLaguuniHandlers(laguuniHandlerState, baseUrl, options)
}

export function resetLaguuniHandlerState() {
  resetSharedLaguuniHandlerState(laguuniHandlerState)
}
