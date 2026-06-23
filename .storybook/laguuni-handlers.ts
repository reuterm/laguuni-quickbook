import {
  createLaguuniApiHandlers,
  createLaguuniHandlerState,
  resetLaguuniHandlerState,
} from '../tests/msw/handlers/laguuni-core'

export const STORYBOOK_LAGUUNI_API_BASE_URL =
  'https://storybook.laguuni.invalid'

export function getStorybookLaguuniApiBaseUrl() {
  return globalThis.location?.origin ?? STORYBOOK_LAGUUNI_API_BASE_URL
}

const storybookLaguuniHandlerState = createLaguuniHandlerState()

type StorybookLaguuniScenario =
  | 'booking-enabled'
  | 'failed-booking'
  | 'payment-required'

export function createStorybookLaguuniHandlers(
  scenario: StorybookLaguuniScenario = 'booking-enabled',
  baseUrl = getStorybookLaguuniApiBaseUrl(),
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
