import Stack from '@mui/material/Stack'
import { useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'

import { PageLayout } from '@/components/common/PageLayout'
import { FilterViewContext } from '@/components/FilterView/context'
import { applyFilters } from '@/components/FilterView/applyFilters'
import type { FilterContext, FilterOptions, GenericFilter } from '@/components/FilterView/filters/createFilter'
import { FilterTray } from '@/components/FilterView/FilterTray'
import { precomputeFilters } from '@/components/FilterView/precompute'
import { useFilterStorage } from '@/components/FilterView/useFilterStorage'
import type { FilteredCourse } from '@/util/coursesOfPopulation'
import { filterCourses } from '@/util/coursesOfPopulation'
import type { FormattedStudent as Student } from '@oodikone/shared/types/studentData'
import type { PopulationCourseStats } from '@oodikone/shared/routes/populations'

export const FilterView = <Options extends FilterOptions>({
  children,
  filters,
  students,
  coursestatistics,
  initialOptions,
}: {
  students: Student[]
  coursestatistics: PopulationCourseStats | undefined
  children: (filteredStudents: Student[], filteredCourses: FilteredCourse[]) => ReactNode
  filters: GenericFilter<Options>[]
  initialOptions: Options
}) => {
  const { storedOptions, setFilterOptions, resetFilterOptions, resetAllFilterOptions } = useFilterStorage<Options>()

  const filterArgs = useMemo(() => Object.fromEntries(filters.map(({ key, args }) => [key, args])), [filters])
  const filterOptions: Record<string, Options> = useMemo(
    () =>
      Object.fromEntries(
        filters.map(({ key, defaultOptions }) => [key, storedOptions[key] ?? initialOptions?.[key] ?? defaultOptions])
      ),
    [filters, storedOptions, initialOptions]
  )

  const precomputed = useMemo(() => precomputeFilters(filters, students), [filters, students])

  const getContextByKey = useCallback(
    (key: string): FilterContext<Options> => ({
      precomputed: precomputed[key],
      options: filterOptions[key],
      args: filterArgs[key],
    }),
    [precomputed, filterOptions, filterArgs]
  )

  const filtersInUse = filters.some(({ key, isActive }) => isActive(filterOptions[key], undefined))

  const [filteredStudents, filteredCourses] = useMemo(() => {
    const fstudents = applyFilters(filters, students, getContextByKey)

    const fcourses = filterCourses(coursestatistics, fstudents)

    return [fstudents, fcourses]
  }, [filters, students, coursestatistics, getContextByKey])

  return (
    <Stack flexDirection="row">
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
      <PageLayout width="calc(100% - 20em)">
        <FilterViewContext.Provider value={{ getContextByKey, setFilterOptions }}>
          {children(filteredStudents, filteredCourses)}
        </FilterViewContext.Provider>
      </PageLayout>
    </Stack>
  )
}
