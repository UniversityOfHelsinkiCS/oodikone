import type { Result } from '../util'

type Params = Record<string, string> | string

// eslint-disable-next-line import-x/no-unused-modules
export type BaseConfig = { baseUrl?: string; params?: Params; timeout?: number } & RequestInit

// eslint-disable-next-line import-x/no-unused-modules
export type RequestConfig = { params?: Params; timeout?: number } & RequestInit

const buildBaseUrl = (baseUrl: string) => {
  try {
    return new URL(baseUrl)
  } catch (_) {
    // Invalid URLs will be caught here if the baseUrl cannot be extended on top of page origin.
    return new URL(baseUrl, globalThis?.location.origin)
  }
}

const buildUrl = (
  baseUrl: string | undefined = '',
  url: string | undefined = '',
  baseParams?: Params,
  params?: Params
) => {
  const base = baseUrl ? buildBaseUrl(url ? baseUrl.replace(/\/?$/, '/') : baseUrl) : ''
  const path = new URL(url.replace(/^\//, ''), base)

  const baseUrlParams = new URLSearchParams(baseParams)
  const urlParams = new URLSearchParams(params)

  Array.from(baseUrlParams.entries()).forEach(([key, val]) => path.searchParams.set(key, val))
  Array.from(urlParams.entries()).forEach(([key, val]) => path.searchParams.set(key, val))

  return path.href
}

const buildSignal = (timeout: number | undefined): AbortSignal | undefined =>
  timeout !== undefined ? AbortSignal.timeout(timeout) : undefined

const prepData = <T>(data: T) => JSON.stringify(data)

// We only really use JSON in Oodikone, so I didn't fell like implementing this function.
const getMimeType = <T>(_: T) => {
  return 'application/json'
}

const convertDataBasedOnCT = <R>(contentType: string, res: Response): Promise<R> => {
  // Should be the most common type, as express and JAMI return JSON
  if (contentType.startsWith('application/json')) return res.json() as Promise<R>
  else if (contentType.startsWith('application/octet-stream')) return res.arrayBuffer() as Promise<R>
  else if (contentType.startsWith('multipart/form-data')) return res.formData() as Promise<R>
  else if (contentType.startsWith('text/')) return res.text() as Promise<R>
  else return res.blob() as Promise<R>
}

const handleRequestData = <R>(url: string, options: RequestInit): Promise<Result<R>> =>
  globalThis
    .fetch(url, options)
    .then(async res => {
      const ct = res.headers.get('content-type') ?? ''

      return {
        ...res,
        data: await convertDataBasedOnCT<R>(ct, res),
        error: null,
      }
    })
    .catch(error => ({
      data: null,
      error,
    }))

const fetcher = <T>({
  baseUrl,
  params: baseParams,
  timeout: baseTimeout,
  headers: baseHeaders,
  ...baseRest
}: BaseConfig) => ({
  get: <R>(url: string | undefined, { params, headers, timeout, ...rest }: RequestConfig): Promise<Result<R>> =>
    handleRequestData(buildUrl(baseUrl, url, baseParams, params), {
      signal: buildSignal(timeout ?? baseTimeout),
      headers: {
        ...baseHeaders,
        ...headers,
      },
      method: 'GET',
      ...baseRest,
      ...rest,
    }),
  post: <R>(
    url: string | undefined,
    data: T,
    { params, headers, timeout, ...rest }: RequestConfig
  ): Promise<Result<R>> =>
    handleRequestData(buildUrl(baseUrl, url, baseParams, params), {
      signal: buildSignal(timeout ?? baseTimeout),
      headers: {
        'Content-Type': getMimeType(data),
        ...baseHeaders,
        ...headers,
      },
      method: 'POST',
      body: prepData(data),
      ...baseRest,
      ...rest,
    }),
  put: <R>(
    url: string | undefined,
    data: T,
    { params, headers, timeout, ...rest }: RequestConfig
  ): Promise<Result<R>> =>
    handleRequestData(buildUrl(baseUrl, url, baseParams, params), {
      signal: buildSignal(timeout ?? baseTimeout),
      headers: {
        'Content-Type': getMimeType(data),
        ...baseHeaders,
        ...headers,
      },
      method: 'PUT',
      body: prepData(data),
      ...baseRest,
      ...rest,
    }),
  delete: <R>(url: string | undefined, { params, headers, timeout, ...rest }: RequestConfig): Promise<Result<R>> =>
    handleRequestData(buildUrl(baseUrl, url, baseParams, params), {
      signal: buildSignal(timeout ?? baseTimeout),
      headers: {
        ...baseHeaders,
        ...headers,
      },
      method: 'DELETE',
      ...baseRest,
      ...rest,
    }),
})

export const Fetchios = {
  create: <R>(config: BaseConfig) => fetcher<R>(config),
  get: <R>(url: string | undefined, config: RequestConfig): Promise<Result<R>> =>
    fetcher<R>({ baseUrl: url }).get(undefined, config),
  post: <R, T = unknown>(url: string | undefined, data: T, config: RequestConfig): Promise<Result<R>> =>
    fetcher<T>({ baseUrl: url }).post<R>(undefined, data, config),
  put: <R, T = unknown>(url: string | undefined, data: T, config: RequestConfig): Promise<Result<R>> =>
    fetcher<T>({ baseUrl: url }).put<R>(undefined, data, config),
  delete: <R>(url: string | undefined, config: RequestConfig): Promise<Result<R>> =>
    fetcher<R>({ baseUrl: url }).delete(undefined, config),
}
