import { useContext } from 'react'
import { useAppDispatch } from '@/redux/hooks'
import { FilterViewContext } from './context'

export const useFilters = () => {
  const dispatch = useAppDispatch()
  const { getContextByKey, viewName } = useContext(FilterViewContext)

  const filterDispatch = filterAction => dispatch(filterAction(viewName, getContextByKey))

  const useFilterSelector = filterSelector => {
    const { options } = getContextByKey(filterSelector.filter)
    return filterSelector(options)
  }

  return {
    useFilterSelector,
    filterDispatch,
  }
}
