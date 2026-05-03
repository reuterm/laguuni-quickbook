import type { HttpResponse } from './client'

export function expectResponse<T>(
  response: HttpResponse<T>,
  expectedStatuses: readonly number[],
  operation: string,
): T {
  if (!expectedStatuses.includes(response.status)) {
    throw new Error(
      `Unexpected status ${response.status} while trying to ${operation}`,
    )
  }

  if (response.data === null) {
    throw new Error(
      `The Laguuni API returned an empty response for ${operation}`,
    )
  }

  return response.data
}
