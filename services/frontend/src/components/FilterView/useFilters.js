import { useContext } from 'react'
import { useAppDispatch } from '@/redux/hooks'
import { FilterViewContext } from './FilterViewContext'

export const useFilters = () => {
  const dispatch = useAppDispatch()
  const { getContextByKey, viewName, filterOptions } = useContext(FilterViewContext)

  const filterDispatch = filterAction => {
    dispatch({
      ...filterAction(viewName, getContextByKey),
      filterAction: filterAction.actionName,
    })
  }

  const useFilterSelector = filterSelector => {
    const options = filterOptions[filterSelector.filter]
    return filterSelector(options)
  }

  return {
    useFilterSelector,
    filterDispatch,
  }
}
