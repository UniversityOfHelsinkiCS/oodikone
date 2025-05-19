import { useMemo } from 'react'

import { selectViewFilters, setFilterOptions, resetFilter, resetViewFilters } from '@/redux/filters'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { keyBy } from '@oodikone/shared/util'

import { FilterTray } from './FilterTray'
import { FilterViewContext } from './FilterViewContext'

const resolveFilterOptions = (store, filters, initialOptions) =>
  Object.fromEntries(
    filters.map(({ key, defaultOptions }) => [key, store[key]?.options ?? initialOptions?.[key] ?? defaultOptions])
  )

export const FilterView = ({
  children,
  name,
  filters: pFilters,
  students,
  displayTray: displayTrayProp,
  initialOptions,
}) => {
  const storeFilterOptions = useAppSelector(state => selectViewFilters(state, name))
  const filters = pFilters.map(filter => (typeof filter === 'function' ? filter() : filter))
  const filtersByKey = keyBy(filters, 'key')
  const filterOptions = useMemo(
    () => resolveFilterOptions(storeFilterOptions, filters, initialOptions),
    [storeFilterOptions, filters, initialOptions]
  )
  const orderedFilters = filters.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))

  const displayTray = displayTrayProp !== undefined ? !!displayTrayProp : true

  const precomputed = useMemo(
    () =>
      Object.fromEntries(
        orderedFilters
          .filter(({ precompute }) => precompute)
          .map(({ precompute, key }) => [
            key,
            precompute({
              students,
              options: filterOptions[key] ?? filtersByKey[key].defaultOptions,
              precomputed: null,
              args: filtersByKey[key].args,
            }),
          ])
      ),
    [orderedFilters]
  )

  const getFilterContext = key => ({
    students,
    options: filterOptions[key] ?? null,
    precomputed: precomputed[key] ?? null,
    args: filtersByKey[key].args ?? null,
  })

  const applyFilters = filter =>
    filter
      .map(filter => [filter, getFilterContext(filter.key)])
      .filter(([{ key, isActive }, ctx]) => isActive(filterOptions[key], ctx))
      .reduce((students, [{ filter }, ctx]) => {
        return students.filter(student => filter(student, ctx.options, ctx))
      }, students)

  const filteredStudents = useMemo(() => applyFilters(orderedFilters), [orderedFilters])

  const areOptionsDirty = key => !!storeFilterOptions[key]

  const dispatch = useAppDispatch()

  const value = {
    viewName: name,
    getContextByKey: getFilterContext,
    allStudents: students,
    filteredStudents,
    filterOptions,
    filters,
    precomputed,
    areOptionsDirty,
    withoutFilter: key => applyFilters(orderedFilters.filter(filter => filter.key !== key)),
    setFilterOptions: (filter, options) => dispatch(setFilterOptions({ view: name, filter, options })),
    resetFilter: filter => dispatch(resetFilter({ view: name, filter })),
    resetFilters: () => dispatch(resetViewFilters({ view: name })),
  }

  return (
    <FilterViewContext.Provider value={value}>
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'center', gap: '0.75rem' }}>
        <div style={{ zIndex: 1, alignSelf: 'flex-start', position: 'sticky', top: '1rem' }}>
          {displayTray && <FilterTray />}
        </div>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          {typeof children === 'function' ? children(filteredStudents) : children}
        </div>
      </div>
    </FilterViewContext.Provider>
  )
}
