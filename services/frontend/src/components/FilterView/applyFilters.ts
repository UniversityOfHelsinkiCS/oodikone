import type { FilterContext, FilterOptions, GenericFilter } from '@/components/FilterView/filters/createFilter'
import type { FormattedStudent as Student } from '@oodikone/shared/types/studentData'

export const applyFilters = (
  filters: GenericFilter[],
  students: Student[],
  getContextByKey: (key: string) => FilterContext<FilterOptions, any, any>
) =>
  filters
    .filter(({ key, isActive }) => isActive(getContextByKey(key).options, undefined))
    .reduce((remaining, { key, filter, mutate }) => {
      const ctx = getContextByKey(key)
      return remaining.filter(student => filter(student, ctx)).map(student => mutate?.(student, ctx) ?? student)
    }, students)
