// eslint-disable-next-line import-x/no-unused-modules
export type BaseConfig = { baseUrl: string | undefined } & RequestInit

// eslint-disable-next-line import-x/no-unused-modules
export type RequestConfig = {
  params?: Record<string, string | readonly string[]>
  [x: string]: any
}

const buildUrl = (baseUrl: string | undefined = '', url: string | undefined = '', params: Record<string, any> = {}) => {
  const urlParams = new URLSearchParams(params)
  return baseUrl + url + urlParams.toString()
}

// We only really use JSON in Oodikone, so I didn't fell like implementing this function.
const getMimeType = <T>(_: T) => {
  return 'application/json'
}

const fetcher = <T extends BodyInit | undefined>({ baseUrl }: BaseConfig) => ({
  get: (url: string | undefined, { params, headers, ...rest }: RequestConfig) =>
    fetch(buildUrl(baseUrl, url, params), {
      headers,
      method: 'GET',
      ...rest,
    }),
  post: (url: string | undefined, data: T, { params, headers, ...rest }: RequestConfig) =>
    fetch(buildUrl(baseUrl, url, params), {
      headers: {
        'Content-Type': getMimeType(data),
        ...headers,
      },
      method: 'POST',
      body: data,
      ...rest,
    }),
  put: (url: string | undefined, data: T, { params, headers, ...rest }: RequestConfig) =>
    fetch(buildUrl(baseUrl, url, params), {
      headers: {
        'Content-Type': getMimeType(data),
        ...headers,
      },
      method: 'PUT',
      body: data,
      ...rest,
    }),
  delete: (url: string | undefined, { params, headers, ...rest }: RequestConfig) =>
    fetch(buildUrl(baseUrl, url, params), {
      headers,
      method: 'DELETE',
      ...rest,
    }),
})

export const Fetchios = {
  create: (config: BaseConfig) => fetcher(config),
  get: (url: string | undefined, config: RequestConfig) => fetcher({ baseUrl: undefined }).get(url, config),
  post: <T extends BodyInit | undefined>(url: string | undefined, data: T, config: RequestConfig) =>
    fetcher({ baseUrl: undefined }).post(url, data, config),
  put: <T extends BodyInit | undefined>(url: string | undefined, data: T, config: RequestConfig) =>
    fetcher({ baseUrl: undefined }).put(url, data, config),
  delete: (url: string | undefined, config: RequestConfig) => fetcher({ baseUrl: undefined }).delete(url, config),
}
