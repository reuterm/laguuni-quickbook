export const DEFAULT_LAGUUNI_API_BASE_URL = 'https://shop.laguuniin.fi'

export type JsonDecoder<T> = (value: unknown) => T

export type QueryValue = boolean | number | string

export type HttpMethod = 'DELETE' | 'GET' | 'POST'

export type HttpRequest<T> = {
  body?: unknown
  decoder: JsonDecoder<T>
  headers?: HeadersInit
  method?: HttpMethod
  path: string
  query?: Record<string, QueryValue | undefined>
}

export type HttpResponse<T> = {
  data: T | null
  status: number
}

export type HttpClient = {
  request<T>(request: HttpRequest<T>): Promise<HttpResponse<T>>
}

type FetchImplementation = typeof fetch

export type FetchHttpClientOptions = {
  baseUrl: string
  fetchImplementation: FetchImplementation
}

export function normalizeApiBaseUrl(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '')

  if (normalizedBaseUrl.length === 0) {
    throw new Error('Laguuni API base URL cannot be empty')
  }

  return normalizedBaseUrl
}

export class FetchHttpClient implements HttpClient {
  readonly #baseUrl: string
  readonly #fetchImplementation: FetchImplementation

  constructor({ baseUrl, fetchImplementation }: FetchHttpClientOptions) {
    this.#baseUrl = normalizeApiBaseUrl(baseUrl)
    this.#fetchImplementation = fetchImplementation
  }

  async request<T>({
    body,
    decoder,
    headers,
    method = 'GET',
    path,
    query,
  }: HttpRequest<T>): Promise<HttpResponse<T>> {
    const requestUrl = buildUrl(this.#baseUrl, path, query)
    const requestInit: RequestInit = { method }

    if (body !== undefined) {
      requestInit.body = JSON.stringify(body)
    }

    const resolvedHeaders = createHeaders(headers, body)

    if (resolvedHeaders !== undefined) {
      requestInit.headers = resolvedHeaders
    }

    const response = await this.#fetchImplementation(requestUrl, requestInit)

    const rawResponseBody = await response.text()

    return {
      data: parseJsonBody(rawResponseBody, decoder),
      status: response.status,
    }
  }
}

function createHeaders(
  headers: HeadersInit | undefined,
  body: unknown,
): HeadersInit | undefined {
  if (body === undefined) {
    return headers
  }

  return {
    'content-type': 'application/json',
    ...headers,
  }
}

function buildUrl(
  baseUrl: string,
  path: string,
  query: Record<string, QueryValue | undefined> | undefined,
): string {
  const resolvedPath = path.startsWith('/') ? path.slice(1) : path
  const url = new URL(resolvedPath, `${baseUrl}/`)

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

function parseJsonBody<T>(
  rawResponseBody: string,
  decoder: JsonDecoder<T>,
): T | null {
  if (rawResponseBody.length === 0) {
    return null
  }

  try {
    return decoder(JSON.parse(rawResponseBody))
  } catch (error) {
    throw new Error(
      `Expected a JSON response from the Laguuni API: ${
        error instanceof Error ? error.message : 'unknown parse error'
      }`,
    )
  }
}
