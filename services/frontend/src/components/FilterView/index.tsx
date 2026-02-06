import Stack from '@mui/material/Stack'
import { useMemo, type FC, type ReactNode } from 'react'

import { selectViewFilters } from '@/redux/filters'
import { useAppSelector } from '@/redux/hooks'
import type { ExpandedCourseStats } from '@/redux/populations/util'
import { filterCourses, type FilteredCourse } from '@/util/coursesOfPopulation'
import type { FormattedStudent as Student } from '@oodikone/shared/types/studentData'

import { PageLayout } from '../common/PageLayout'
import { FilterViewContext } from './context'
import type { FilterContext, FilterViewContextState } from './context'

import type { Filter } from './filters/createFilter'
import { FilterTray } from './FilterTray'

export const FilterView: FC<{
  children: (filteredStudents: Student[], filteredCourses: FilteredCourse[]) => ReactNode
  name: string
  filters: Filter[]
  students: Student[]
  coursestatistics: ExpandedCourseStats | undefined
  displayTray: boolean
  initialOptions: Record<Filter['key'], Filter['defaultOptions']>
}> = ({ children, name, filters, students, coursestatistics, displayTray, initialOptions }) => {
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
        filters.map(({ key, precompute }) => [
          key,
          precompute?.({
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

  const [filteredStudents, filteredCourses] = useMemo(() => {
    const fstudents = filters
      .slice()
      .filter(({ key, isActive }) => isActive(filterOptions[key]))
      .reduce((students, { key, filter, mutate }) => {
        const ctx = getFilterContext(key)
        return students.filter(student => filter(student, ctx)).map(student => mutate?.(student, ctx) ?? student)
      }, students)

    const fcourses = filterCourses(coursestatistics, fstudents)

    return [fstudents, fcourses]
  }, [filters, filterOptions])

  const ctxState: FilterViewContextState = { viewName: name, getContextByKey: getFilterContext }

  return (
    <FilterViewContext.Provider value={ctxState}>
      <Stack direction="row" id="filterview-stack">
        {displayTray ? (
          <FilterTray allStudents={students} filters={filters} numberOfFilteredStudents={filteredStudents.length} />
        ) : null}
        <PageLayout maxWidth="80vw">{children(filteredStudents, filteredCourses)}</PageLayout>
      </Stack>
    </FilterViewContext.Provider>
  )
}
