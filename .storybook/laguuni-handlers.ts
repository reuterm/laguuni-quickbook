import {
  createLaguuniApiHandlers,
  createLaguuniHandlerState,
  type LaguuniCheckoutScenario,
  pruneLaguuniHandlerState,
} from '../tests/msw/handlers/laguuni-core'

export const STORYBOOK_LAGUUNI_API_BASE_URL =
  'https://storybook.laguuni.invalid'

const STORYBOOK_LAGUUNI_HANDLER_SCOPE = '__storybook/laguuni'

export type StorybookLaguuniScenario = 'booking-enabled' | LaguuniCheckoutScenario

type CreateStorybookLaguuniHandlersOptions = {
  baseUrl?: string
  checkoutScenario?: LaguuniCheckoutScenario
}

const storybookLaguuniHandlerState = createLaguuniHandlerState()

export function getStorybookLaguuniApiBaseUrl(
  scopeId = 'default',
  scenario: StorybookLaguuniScenario = 'booking-enabled',
) {
  const origin = globalThis.location?.origin ?? STORYBOOK_LAGUUNI_API_BASE_URL

  return `${origin}/${STORYBOOK_LAGUUNI_HANDLER_SCOPE}/${encodeURIComponent(
    scopeId,
  )}/${scenario}`
}

export function getStorybookLaguuniHandlerBaseUrl() {
  const origin = globalThis.location?.origin ?? STORYBOOK_LAGUUNI_API_BASE_URL

  return `${origin}/${STORYBOOK_LAGUUNI_HANDLER_SCOPE}/:scopeId/:scenario`
}

export function createStorybookLaguuniHandlers(
  {
    baseUrl = getStorybookLaguuniHandlerBaseUrl(),
    checkoutScenario,
  }: CreateStorybookLaguuniHandlersOptions = {},
) {
  return createLaguuniApiHandlers(storybookLaguuniHandlerState, {
    baseUrl,
    createBasketToken: createScopedBasketToken,
    resolveCheckoutScenario: (request) => checkoutScenario ?? readCheckoutScenario(request),
    includeCleanupHandlers: true,
  })
}

export function createStorybookLaguuniParameters(
  scenario: StorybookLaguuniScenario = 'booking-enabled',
) {
  return scenario === 'booking-enabled'
    ? undefined
    : {
        checkoutScenario: scenario,
      }
}

export function pruneStorybookLaguuniScope(scopeId: string) {
  pruneLaguuniHandlerState(
    storybookLaguuniHandlerState,
    (basketToken) => basketToken.startsWith(`${scopeId}::`),
  )
}

function createScopedBasketToken(request: Request): string {
  return `${readStoryScopeId(request)}::${crypto.randomUUID()}`
}

function readCheckoutScenario(request: Request): LaguuniCheckoutScenario | undefined {
  const scenario = readScopedPathSegment(request, 1)

  if (scenario === 'payment-required' || scenario === 'failed-booking') {
    return scenario
  }

  return undefined
}

function readStoryScopeId(request: Request): string {
  const scopeId = readScopedPathSegment(request, 0)

  return scopeId && scopeId.length > 0 ? scopeId : 'default'
}

function readScopedPathSegment(
  request: Request,
  offsetFromScopeRoot: number,
): string | undefined {
  const segments = new URL(request.url).pathname.split('/').filter(Boolean)
  const scopeRootIndex = segments.indexOf('laguuni')

  if (scopeRootIndex < 0) {
    return undefined
  }

  return segments[scopeRootIndex + 1 + offsetFromScopeRoot]
}
