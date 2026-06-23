import {
  createStorybookLaguuniHandlers as createCoreStorybookLaguuniHandlers,
  createLaguuniHandlerState,
  resetLaguuniHandlerState,
  type StorybookLaguuniScenario,
} from '../tests/msw/handlers/laguuni-core'

const storybookLaguuniHandlerState = createLaguuniHandlerState()

export function createStorybookLaguuniHandlers(
  scenario: StorybookLaguuniScenario = 'booking-enabled',
  baseUrl?: string,
) {
  return createCoreStorybookLaguuniHandlers(
    storybookLaguuniHandlerState,
    scenario,
    baseUrl,
  )
}

export function resetStorybookLaguuniHandlerState() {
  resetLaguuniHandlerState(storybookLaguuniHandlerState)
}
