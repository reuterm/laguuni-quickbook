import { delay, HttpResponse, http } from 'msw'

import {
  createLaguuniApiHandlers,
  createLaguuniHandlerState,
  type LaguuniCheckoutScenario,
  pruneLaguuniHandlerState,
} from '../tests/msw/handlers/laguuni-core'

export const STORYBOOK_LAGUUNI_API_BASE_URL =
  'https://storybook.laguuni.invalid'

const STORYBOOK_LAGUUNI_HANDLER_SCOPE = '__storybook/laguuni'

export type StorybookLaguuniScenario =
  | 'booking-enabled'
  | 'availability-error'
  | 'availability-loading'
  | LaguuniCheckoutScenario
  | 'invalid-code'

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

export function createStorybookLaguuniHandlers({
  baseUrl = getStorybookLaguuniHandlerBaseUrl(),
  checkoutScenario,
}: CreateStorybookLaguuniHandlersOptions = {}) {
  return [
    http.get(
      `${baseUrl}/api/laguuni/products/:productId/availabledates/:anchorDate.json`,
      async ({ request }) => {
        const scenario = readStoryScenario(request)

        if (scenario === 'availability-loading') {
          await delay(3000)
        }

        if (scenario === 'availability-error') {
          return HttpResponse.json(
            {
              errorCode: 'GENERAL_ERROR',
              errorMessage: 'Fixture outage',
              status: 'error',
            },
            { status: 500 },
          )
        }

        return undefined
      },
    ),
    http.get(
      `${baseUrl}/api/laguuni/discounts/:code/public.json`,
      ({ request }) => {
        if (readStoryScenario(request) !== 'invalid-code') {
          return undefined
        }

        return HttpResponse.json(
          {
            errorCode: 'GENERAL_ERROR',
            errorMessage: 'Antamasi koodi on virheellinen.',
            status: 'error',
          },
          { status: 404 },
        )
      },
    ),
    ...createLaguuniApiHandlers(storybookLaguuniHandlerState, {
      baseUrl,
      createBasketToken: createScopedBasketToken,
      resolveCheckoutScenario: (request) =>
        checkoutScenario ?? readCheckoutScenario(request),
      includeCleanupHandlers: true,
    }),
  ]
}

export function createStorybookLaguuniParameters(
  scenario: StorybookLaguuniScenario = 'booking-enabled',
) {
  return scenario === 'booking-enabled'
    ? undefined
    : {
        scenario,
      }
}

export function pruneStorybookLaguuniScope(scopeId: string) {
  pruneLaguuniHandlerState(storybookLaguuniHandlerState, (basketToken) =>
    basketToken.startsWith(`${scopeId}::`),
  )
}

function createScopedBasketToken(request: Request): string {
  return `${readStoryScopeId(request)}::${crypto.randomUUID()}`
}

function readCheckoutScenario(
  request: Request,
): LaguuniCheckoutScenario | undefined {
  const scenario = readStoryScenario(request)

  if (scenario === 'payment-required' || scenario === 'failed-booking') {
    return scenario
  }

  return undefined
}

function readStoryScenario(
  request: Request,
): StorybookLaguuniScenario | undefined {
  return readScopedPathSegment(request, 1) as
    | StorybookLaguuniScenario
    | undefined
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
