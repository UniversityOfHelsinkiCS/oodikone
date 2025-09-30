import Stack from '@mui/material/Stack'
import { FC, useMemo } from 'react'

import { selectViewFilters } from '@/redux/filters'
import { useAppSelector } from '@/redux/hooks'
import { filterCourses } from '@/util/coursesOfPopulation'
import type { CourseStats } from '@oodikone/shared/routes/populations'
import type { FormattedCourse as Course } from '@oodikone/shared/types/courseData'
import type { FormattedStudent as Student } from '@oodikone/shared/types/studentData'

import { FilterViewContext } from './context'
import type { FilterContext, FilterViewContextState } from './context'

import type { Filter } from './filters/createFilter'
import { FilterTray } from './FilterTray'

export const FilterView: FC<{
  children: (filteredStudents: Student[], filteredCourses: Course[]) => React.ReactNode
  name: string
  filters: Filter[]
  students: Student[]
  courses: CourseStats[]
  displayTray: boolean
  initialOptions: Record<Filter['key'], any>
}> = ({ children, name, filters, students, courses, displayTray, initialOptions }) => {
  const storedOptions = useAppSelector(state => selectViewFilters(state, name))

  const filterArgs = Object.fromEntries(filters.map(({ key, args }) => [key, args]))
  const filterOptions = useMemo(
    () =>
      Object.fromEntries(
        filters.map(({ key, defaultOptions }) => [key, storedOptions[key] ?? initialOptions?.[key] ?? defaultOptions])
      ),
    [filters, initialOptions, storedOptions]
  )

  const precomputed = useMemo(
    () =>
      Object.fromEntries(
        filters
          .filter(({ precompute }) => precompute !== undefined)
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
    options: filterOptions[key],
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
  const filteredCourses = filterCourses(courses, filteredStudents.length)

  const ctxState: FilterViewContextState = { viewName: name, getContextByKey: getFilterContext }

  return (
    <FilterViewContext.Provider value={ctxState}>
      <Stack direction="row" sx={{ alignContent: 'center' }}>
        {displayTray ? (
          <FilterTray allStudents={students} filters={filters} numberOfFilteredStudents={filteredStudents.length} />
        ) : null}
        {children(filteredStudents, filteredCourses)}
      </Stack>
    </FilterViewContext.Provider>
  )
}
