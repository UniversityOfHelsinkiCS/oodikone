import { useContext } from 'react'

import { FilterViewContext, FilterViewContextState } from './context'
import { FilterOptions } from './filters/createFilter'
// import { Action, FilterOptions, Selector } from './filters/createFilter'

// type GenericAction<Options extends FilterOptions> = Action<Options, any>
// type GenericSelector<Options extends FilterOptions> = Selector<Options, any, any>

export const useFilters = <Options extends FilterOptions>() => {
  const { getContextByKey, setFilterOptions } = useContext(FilterViewContext) as FilterViewContextState<Options>

  const useFilterDispatch = filterAction => filterAction(getContextByKey, setFilterOptions)
  const useFilterSelector = filterSelector => filterSelector(getContextByKey)

  return {
    useFilterSelector,
    useFilterDispatch,
  }
}
