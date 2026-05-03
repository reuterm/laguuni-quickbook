import { setupServer } from 'msw/node'

import { laguuniHandlers } from './handlers/laguuni'

export const server = setupServer(...laguuniHandlers)
