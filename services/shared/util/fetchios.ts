type Res<T> = Response & { data: T }
type Params = Record<string, string> | string

// eslint-disable-next-line import-x/no-unused-modules
export type BaseConfig = { baseUrl?: string; params?: Params; timeout?: number } & RequestInit

// eslint-disable-next-line import-x/no-unused-modules
export type RequestConfig = { params?: Params; timeout?: number } & RequestInit

const buildUrl = (
  baseUrl: string | undefined = '',
  url: string | undefined = '',
  baseParams?: Params,
  params?: Params
) => {
  const baseUrlParams = new URLSearchParams(baseParams)
  const urlParams = new URLSearchParams(params)

  Array.from(urlParams.entries()).forEach(([key, val]) => baseUrlParams.set(key, val))

  return `${baseUrl}${url}?${baseUrlParams.toString()}`
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

const handleRequestData = <R>(url: string, options: RequestInit): Promise<Res<R>> =>
  globalThis.fetch(url, options).then(async res => {
    const ct = res.headers.get('content-type') ?? ''

    return {
      ...res,
      data: await convertDataBasedOnCT<R>(ct, res),
    }
  })

const fetcher = <T>({ baseUrl, params: baseParams, timeout: baseTimeout }: BaseConfig) => ({
  get: <R>(url: string | undefined, { params, headers, timeout, ...rest }: RequestConfig): Promise<Res<R>> =>
    handleRequestData(buildUrl(baseUrl, url, baseParams, params), {
      signal: buildSignal(timeout ?? baseTimeout),
      headers,
      method: 'GET',
      ...rest,
    }),
  post: <R>(url: string | undefined, data: T, { params, headers, timeout, ...rest }: RequestConfig): Promise<Res<R>> =>
    handleRequestData(buildUrl(baseUrl, url, baseParams, params), {
      signal: buildSignal(timeout ?? baseTimeout),
      headers: {
        'Content-Type': getMimeType(data),
        ...headers,
      },
      method: 'POST',
      body: prepData(data),
      ...rest,
    }),
  put: <R>(url: string | undefined, data: T, { params, headers, timeout, ...rest }: RequestConfig): Promise<Res<R>> =>
    handleRequestData(buildUrl(baseUrl, url, baseParams, params), {
      signal: buildSignal(timeout ?? baseTimeout),
      headers: {
        'Content-Type': getMimeType(data),
        ...headers,
      },
      method: 'PUT',
      body: prepData(data),
      ...rest,
    }),
  delete: <R>(url: string | undefined, { params, headers, timeout, ...rest }: RequestConfig): Promise<Res<R>> =>
    handleRequestData(buildUrl(baseUrl, url, baseParams, params), {
      signal: buildSignal(timeout ?? baseTimeout),
      headers,
      method: 'DELETE',
      ...rest,
    }),
})

export const Fetchios = {
  create: <R>(config: BaseConfig) => fetcher<R>(config),
  get: <R>(url: string | undefined, config: RequestConfig): Promise<Res<R>> =>
    fetcher<R>({ baseUrl: undefined }).get(url, config),
  post: <R, T = unknown>(url: string | undefined, data: T, config: RequestConfig): Promise<Res<R>> =>
    fetcher<T>({ baseUrl: undefined }).post<R>(url, data, config),
  put: <R, T = unknown>(url: string | undefined, data: T, config: RequestConfig): Promise<Res<R>> =>
    fetcher<T>({ baseUrl: undefined }).put<R>(url, data, config),
  delete: <R>(url: string | undefined, config: RequestConfig): Promise<Res<R>> =>
    fetcher<R>({ baseUrl: undefined }).delete(url, config),
}
