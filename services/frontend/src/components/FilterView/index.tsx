import Stack from '@mui/material/Stack'
import { FC, useMemo } from 'react'

import { selectViewFilters, setFilterOptions, resetFilter, resetViewFilters } from '@/redux/filters'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { useGetPopulationStatisticsByCourseQuery } from '@/redux/populations'
import { filterCourses } from '@/util/coursesOfPopulation'
import type { CourseStats } from '@oodikone/shared/routes/populations'

import { FilterViewContext } from './context'
import type { FilterContext, FilterViewContextState } from './context'

import type { Filter, FilterFactory } from './filters/createFilter'
import { FilterTray } from './FilterTray'

// TODO: Use acual Student type when available
export type Student = ReturnType<typeof useGetPopulationStatisticsByCourseQuery>['data']['students']

export const FilterView: FC<{
  children: (filteredStudents: Student[], filteredCourses: any[]) => any
  name: string
  filters: (FilterFactory | Filter)[]
  students: Student[]
  courses: CourseStats[]
  displayTray: boolean
  initialOptions: Record<Filter['key'], any>
}> = ({ children, name, filters: pFilters, students, courses, displayTray, initialOptions }) => {
  const dispatch = useAppDispatch()
  const storeFilterOptions = useAppSelector(state => selectViewFilters(state, name))

  const filters: Filter[] = pFilters.map(filter => (typeof filter === 'function' ? filter() : filter))

  const filterArgs = Object.fromEntries(filters.map(({ key, args }) => [key, args]))
  const filterOptions = useMemo(
    () =>
      Object.fromEntries(
        filters.map(({ key, defaultOptions }) => [
          key,
          storeFilterOptions[key] ?? initialOptions?.[key] ?? defaultOptions,
        ])
      ),
    [filters, initialOptions, storeFilterOptions]
  )

  const precomputed = useMemo(
    () =>
      Object.fromEntries(
        filters
          .filter(({ precompute }) => !!precompute)
          .map(({ precompute, key }) => [
            key,
            precompute!({
              students: students.slice(), // Copy instead of pass
              options: filterOptions[key],
              args: filterArgs[key],
            }),
          ])
      ),
    [filters]
  )

  const getFilterContext = (key: string): FilterContext => ({
    precomputed: precomputed[key] ?? null,
    options: filterOptions[key] ?? {},
    args: filterArgs[key] ?? null,
  })

  const filteredStudents = useMemo(
    () =>
      filters
        .filter(({ key, isActive }) => isActive(filterOptions[key]))
        .reduce((students, { key, filter }) => {
          return students.filter(student => filter(structuredClone(student), getFilterContext(key)))
        }, students),
    [filters, filterOptions]
  )
  const filteredCourses = filterCourses(courses, filteredStudents)

  const ctxState: FilterViewContextState = {
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
    <FilterViewContext.Provider value={ctxState}>
      <Stack direction="row" sx={{ alignContent: 'center' }}>
        {displayTray && <FilterTray />}
        {children(filteredStudents, filteredCourses)}
      </Stack>
    </FilterViewContext.Provider>
  )
}
