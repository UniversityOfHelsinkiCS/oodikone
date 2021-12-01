import { useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import FilterViewContext from './FilterViewContext'

export default () => {
  const dispatch = useDispatch()
  const { getContextByKey, viewName } = useContext(FilterViewContext)

  const filterDispatch = filterAction => {
    dispatch({
      ...filterAction(viewName, getContextByKey),
      filterAction: filterAction.actionName,
    })
  }

  const useFilterSelector = filterSelector => useSelector(state => filterSelector(state.filters.views[viewName] ?? {}))

  return {
    useFilterSelector,
    filterDispatch,
  }
}
