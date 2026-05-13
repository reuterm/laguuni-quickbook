import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { resetLaguuniHandlerState } from '../../tests/msw/handlers/laguuni'
import { server } from '../../tests/msw/server'

class ResizeObserverMock {
  observe() {}

  disconnect() {}

  unobserve() {}
}

globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver

beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'error',
  })
})

afterEach(() => {
  server.resetHandlers()
  resetLaguuniHandlerState()
})

afterAll(() => {
  server.close()
})
