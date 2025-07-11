import Stack from '@mui/material/Stack'
import { FC, useMemo } from 'react'

import { selectViewFilters, setFilterOptions, resetFilter, resetViewFilters } from '@/redux/filters'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { useGetPopulationStatisticsByCourseQuery } from '@/redux/populations'
import { filterCourses } from '@/util/coursesOfPopulation'
import type { CourseStats } from '@oodikone/shared/routes/populations'
import { keyBy } from '@oodikone/shared/util'

import { FilterViewContext } from './context'
import type { FilterContext, FilterViewContextState } from './context'

import type { Filter, FilterFactory } from './filters/createFilter'
import { FilterTray } from './FilterTray'

// TODO: Use acual Student type when available
export type Student = ReturnType<typeof useGetPopulationStatisticsByCourseQuery>['data']['students']

const resolveFilterOptions = <T,>(
  store: Record<Filter['key'], { options: T }>,
  filters: Filter[],
  initialOptions?: Record<Filter['key'], T>
): Record<Filter['key'], any> =>
  Object.fromEntries(
    filters.map(({ key, defaultOptions }) => [key, store[key]?.options ?? initialOptions?.[key] ?? defaultOptions])
  )

export const FilterView: FC<{
  children: (filteredStudents: Student[], filteredCourses: any[]) => any
  name: string
  filters: (FilterFactory | Filter)[]
  students: Student[]
  courses: CourseStats[]
  displayTray: boolean
  initialOptions?: Record<Filter['key'], any>
}> = ({ children, name, filters: pFilters, students, courses, displayTray, initialOptions }) => {
  const storeFilterOptions = useAppSelector(state => selectViewFilters(state, name))
  const filters: Filter[] = pFilters.map(filter => (typeof filter === 'function' ? filter() : filter))
  const filtersByKey = keyBy(filters, 'key')
  const filterOptions = useMemo(
    () => resolveFilterOptions(storeFilterOptions, filters, initialOptions),
    [storeFilterOptions, filters, initialOptions]
  )
  const orderedFilters = filters.sort((a, b) => a.priority - b.priority)
  const precomputed = useMemo(
    () =>
      Object.fromEntries(
        orderedFilters
          .filter(({ precompute }) => precompute)
          .map(({ precompute, key }) => [
            key,
            precompute!({
              students,
              options: filterOptions[key],
              precomputed: null,
              args: filtersByKey[key].args,
            }),
          ])
      ),
    [orderedFilters]
  )

  const getFilterContext = (key: string): FilterContext => ({
    students,
    options: filterOptions[key] ?? null,
    precomputed: precomputed[key] ?? null,
    args: filtersByKey[key]?.args ?? null,
  })

  const applyFilters = (filters: Filter[]) =>
    filters
      .map(filter => ({ filter, ctx: getFilterContext(filter.key) }))
      .filter(({ filter: { key, isActive } }) => isActive(filterOptions[key]))
      .reduce((students, { filter: { filter }, ctx }) => {
        return students
          .map(student => {
            const newStudent = structuredClone(student)
            return filter(newStudent, ctx) ? newStudent : null
          })
          .filter(Boolean)
      }, students)

  const filteredStudents = useMemo(() => applyFilters(orderedFilters), [orderedFilters])
  const filteredCourses = filterCourses(courses, filteredStudents)

  const dispatch = useAppDispatch()

  const value: FilterViewContextState = {
    viewName: name,
    allStudents: students,
    filters,
    filteredStudents,
    getContextByKey: getFilterContext,
    areOptionsDirty: key => !!storeFilterOptions[key],
    setFilterOptions: (filter, options) => dispatch(setFilterOptions({ view: name, filter, options })),
    resetFilter: filter => dispatch(resetFilter({ view: name, filter })),
    resetFilters: () => dispatch(resetViewFilters({ view: name })),
  }

  return (
    <FilterViewContext.Provider value={value}>
      <Stack direction="row" sx={{ alignContent: 'center' }}>
        {displayTray && <FilterTray />}
        {children(filteredStudents, filteredCourses)}
      </Stack>
    </FilterViewContext.Provider>
  )
}
