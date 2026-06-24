import { useContext } from 'react'

import { FilterViewContext, FilterViewContextState } from '@/components/FilterView/context'
import { FilterOptions } from '@/components/FilterView/filters/createFilter'

export const useFilters = <Options extends FilterOptions>() => {
  const { getContextByKey, setFilterOptions } = useContext(FilterViewContext) as FilterViewContextState<Options>

  const useFilterDispatch = filterAction => filterAction(getContextByKey, setFilterOptions)
  const useFilterSelector = filterSelector => filterSelector(getContextByKey)

  return {
    useFilterSelector,
    useFilterDispatch,
  }
}
