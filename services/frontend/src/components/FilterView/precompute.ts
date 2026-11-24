import type { GenericFilter } from '@/components/FilterView/filters/createFilter'
import type { FormattedStudent as Student } from '@oodikone/shared/types/studentData'

export const precomputeFilters = (
  filters: GenericFilter[],
  students: Student[]
): Record<string, ReturnType<NonNullable<GenericFilter['precompute']>>> =>
  Object.fromEntries(
    filters.map(({ key, args, precompute }) => [key, precompute?.({ students: students.slice(), args })])
  )
