export const parseQueryParams = <T extends object = Record<any, any>>(input: string): T => {
  const params = new URLSearchParams(input)

  const construct = Array.from(params.keys())
    .map(key => [key, params.getAll(key)])
    // This is done on purpose to mimic query-strings behavior
    .map(([key, val]) => [key, val.length <= 1 ? val[0] : val])

  return Object.fromEntries(construct)
}

const setQueryParams = (input: Record<any, any>) => {
  const params = new URLSearchParams()

  Object.entries(input).forEach(([key, val]) => {
    if (Array.isArray(val))
      for (const item of val) {
        params.append(key, item)
      }
    else if (val !== undefined) {
      params.append(key, val)
    }
  })

  return params
}

export const queryParamsToString = (input: Record<any, any>): string => setQueryParams(input).toString()
