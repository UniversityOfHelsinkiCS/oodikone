import { useLocation } from 'react-router'

/** Reactive query param parser.
 *
 * @returns all query parameters in object, destructure as needed.
 *
 * By default all values are string arrays. Array can also be destuctured as follows.
 *
 * @example
 * const args = useParseQueryParams()
 * const string1 = args.item1?.[0]
 * const arrayType = args.noDestructuring
 * const bool = !!args.isBool?.[0]
 */
export const useParseQueryParams = (): Record<string, undefined | string[]> => {
  const location = useLocation()
  const searchString = location.search
  const params = new URLSearchParams(searchString)

  return Object.fromEntries([...params.keys()].map(key => [key, params.getAll(key)]))
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
