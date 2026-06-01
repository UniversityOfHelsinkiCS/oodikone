import { createContext } from 'react'
import { FilterContext } from './filters/createFilter'

export type FilterViewContextState<Options extends Record<string, any>> = {
  setFilterOptions: (filter: string, options: Options) => void
  getContextByKey: (key: string) => FilterContext<Options, any, any>
}

export const FilterViewContext = createContext({
  setFilterOptions: (_, __) => {
    void undefined
  },
  getContextByKey: _ => ({
    precomputed: undefined,
    options: {},
    args: undefined,
  }),
})

FilterViewContext.displayName = 'FilterView'
