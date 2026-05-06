import { createContext } from 'react'

export type FilterContext = {
  precomputed: any // can be null
  options: Record<string, any>
  args: any // can be null
}

export type FilterViewContextState = {
  getContextByKey: (key: string) => FilterContext
}

const defaultState: FilterViewContextState = {
  getContextByKey: () => ({
    precomputed: null,
    options: {},
    args: null,
  }),
}

export const FilterViewContext = createContext<FilterViewContextState>(defaultState)
FilterViewContext.displayName = 'FilterView'
