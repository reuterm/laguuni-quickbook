import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
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
  cleanup()
  server.resetHandlers()
  resetLaguuniHandlerState()
})

afterAll(() => {
  server.close()
})
