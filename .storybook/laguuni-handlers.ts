import {
  createLaguuniApiHandlers,
  createLaguuniHandlerState,
  resetLaguuniHandlerState,
} from '../tests/msw/handlers/laguuni-core'

const storybookLaguuniHandlerState = createLaguuniHandlerState()

type StorybookLaguuniScenario =
  | 'booking-enabled'
  | 'failed-booking'
  | 'payment-required'

export function createStorybookLaguuniHandlers(
  scenario: StorybookLaguuniScenario = 'booking-enabled',
  baseUrl?: string,
) {
  const basketToken =
    scenario === 'payment-required'
      ? 'fixture-basket-payment'
      : scenario === 'failed-booking'
        ? 'fixture-basket-failure'
        : undefined

  return createLaguuniApiHandlers(storybookLaguuniHandlerState, {
    baseUrl,
    basketToken,
    includeCleanupHandlers: true,
  })
}

export function resetStorybookLaguuniHandlerState() {
  resetLaguuniHandlerState(storybookLaguuniHandlerState)
}
