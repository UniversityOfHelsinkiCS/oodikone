import { useCallback, useState } from 'react'

export const useFilterStorage = <Options extends Record<string, any>>() => {
  const [storedOptions, setStoredOptions] = useState<Record<string, Options>>({})

  const resetAllFilterOptions = useCallback(() => setStoredOptions({}), [])

  const resetFilterOptions = useCallback((filter: string) => setStoredOptions(({ [filter]: _, ...rest }) => rest), [])

  const setFilterOptions = useCallback(
    (filter: string, options: Options) => setStoredOptions(previous => ({ ...previous, [filter]: options })),
    []
  )

  return { storedOptions, setFilterOptions, resetFilterOptions, resetAllFilterOptions }
}
