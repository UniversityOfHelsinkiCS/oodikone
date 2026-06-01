import Stack from '@mui/material/Stack'
import { useMemo } from 'react'
import type { ReactNode } from 'react'

import type { ExpandedCourseStats } from '@/redux/populations/util'
import { filterCourses } from '@/util/coursesOfPopulation'
import type { FilteredCourse } from '@/util/coursesOfPopulation'
import type { FormattedStudent as Student } from '@oodikone/shared/types/studentData'

import { PageLayout } from '../common/PageLayout'
import { FilterViewContext } from './context'

import type { FilterContext, FilterOptions, GenericFilter } from './filters/createFilter'
import { FilterTray } from './FilterTray'
import { useFilterStorage } from './useFilterStorage'

export const FilterView = <Options extends FilterOptions>({
  children,
  displayTray,
  filters,
  students,
  coursestatistics,
  initialOptions,
}: {
  students: Student[]
  coursestatistics: ExpandedCourseStats | undefined
  children: (filteredStudents: Student[], filteredCourses: FilteredCourse[]) => ReactNode
  filters: GenericFilter<Options>[]
  displayTray: boolean
  initialOptions: Options
}) => {
  const { storedOptions, setFilterOptions, resetFilterOptions, resetAllFilterOptions } = useFilterStorage<Options>()

  const filterArgs = Object.fromEntries(filters.map(({ key, args }) => [key, args]))
  const filterOptions: Record<string, Options> = Object.fromEntries(
    filters.map(({ key, defaultOptions }) => [key, storedOptions[key] ?? initialOptions?.[key] ?? defaultOptions])
  )

  const precomputed = useMemo(
    () =>
      Object.fromEntries(
        filters.map(({ key, args, precompute }) => [
          key,
          precompute?.({
            students: students.slice(), // Copy instead of pass
            options: filterOptions[key],
            args,
          }),
        ])
      ),
    [filters]
  )

  const getContextByKey = (key: string): FilterContext<Options> => ({
    precomputed: precomputed[key],
    options: filterOptions[key],
    args: filterArgs[key],
  })

  const filtersInUse = filters.some(({ key, isActive }) => isActive(filterOptions[key], undefined))

  const [filteredStudents, filteredCourses] = useMemo(() => {
    const fstudents = filters
      .filter(({ key, isActive }) => isActive(filterOptions[key], undefined))
      .reduce((students, { key, filter, mutate }) => {
        const ctx = getContextByKey(key)
        return students.filter(student => filter(student, ctx)).map(student => mutate?.(student, ctx) ?? student)
      }, students)

    const fcourses = filterCourses(coursestatistics, fstudents)

    return [fstudents, fcourses]
  }, [filters, filterOptions])

  return (
    <Stack direction="row">
      {!!displayTray && (
        <FilterTray
          allStudents={students}
          filters={filters}
          filtersInUse={filtersInUse}
          getContextByKey={getContextByKey}
          numberOfFilteredStudents={filteredStudents.length}
          resetAllFilterOptions={resetAllFilterOptions}
          resetFilterOptions={resetFilterOptions}
          setFilterOptions={setFilterOptions}
        />
      )}
      <PageLayout maxWidth="80vw">
        <FilterViewContext.Provider value={{ getContextByKey, setFilterOptions }}>
          {children(filteredStudents, filteredCourses)}
        </FilterViewContext.Provider>
      </PageLayout>
    </Stack>
  )
}
