import { useMemo } from 'react'

import { selectViewFilters, setFilterOptions, resetFilter, resetViewFilters } from '@/redux/filters'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { useGetPopulationStatisticsByCourseQuery } from '@/redux/populations'
import { keyBy } from '@oodikone/shared/util'

import { FilterViewContext, type FilterViewContextState } from './context'

import { createFilter } from './filters/createFilter'
import { FilterTray } from './FilterTray'

type FilterFactory = ReturnType<typeof createFilter>
export type Filter = ReturnType<FilterFactory>
// TODO: Use acual Student type when available
export type Student = ReturnType<typeof useGetPopulationStatisticsByCourseQuery>['data']['students']

const resolveFilterOptions = (
  store: Record<Filter['key'], any>,
  filters: Filter[],
  initialOptions?: Record<Filter['key'], any>
): Record<Filter['key'], any> =>
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
}: {
  children: (filteredStudents: Student[]) => any
  name: string
  filters: (FilterFactory | Filter)[]
  students: Student[]
  displayTray?: boolean
  initialOptions?: Record<Filter['key'], any>
}) => {
  const storeFilterOptions = useAppSelector(state => selectViewFilters(state, name))
  const filters: Filter[] = pFilters.map(filter => (typeof filter === 'function' ? filter() : filter))
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
              options: filterOptions[key],
              precomputed: null,
              args: filtersByKey[key].args,
            }),
          ])
      ),
    [orderedFilters]
  )

  const getFilterContext = (key: string) => ({
    students,
    options: filterOptions[key] ?? null,
    precomputed: precomputed[key] ?? null,
    args: filtersByKey[key].args ?? null,
  })

  const applyFilters = (filters: Filter[]) =>
    filters
      .map(filter => ({ filter, ctx: getFilterContext(filter.key) }))
      .filter(({ filter: { key, isActive }, ctx }) => isActive(filterOptions[key], ctx))
      .reduce((students, { filter: { filter }, ctx }) => {
        return students
          .map(student => {
            const newStudent = structuredClone(student)
            return filter(newStudent, ctx.options, ctx) ? newStudent : null
          })
          .filter(Boolean)
      }, students)

  const filteredStudents = useMemo(() => applyFilters(orderedFilters), [orderedFilters])

  const dispatch = useAppDispatch()

  const value: FilterViewContextState = {
    viewName: name,
    allStudents: students,
    filters,
    precomputed,
    filterOptions,
    filteredStudents,
    getContextByKey: getFilterContext,
    areOptionsDirty: key => !!storeFilterOptions[key],
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
