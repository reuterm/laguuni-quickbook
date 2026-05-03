import { setupWorker } from 'msw/browser'

import { laguuniHandlers } from './handlers/laguuni'

export const worker = setupWorker(...laguuniHandlers)
