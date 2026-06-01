import { useState } from 'react'

export const useFilterStorage = <Options extends Record<string, any>>() => {
  const [storedOptions, setStoredOptions] = useState<Record<string, Options>>({})

  const resetAllFilterOptions = () => setStoredOptions({})

  const resetFilterOptions = (filter: string) => setStoredOptions(({ [filter]: _, ...rest }) => rest)

  const setFilterOptions = (filter: string, options: Options) =>
    setStoredOptions(() => ({ ...storedOptions, [filter]: options }))

  return { storedOptions, setFilterOptions, resetFilterOptions, resetAllFilterOptions }
}
