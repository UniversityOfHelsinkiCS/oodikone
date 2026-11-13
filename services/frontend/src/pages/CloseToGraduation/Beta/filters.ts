import type { GetTextIn } from '@/components/LanguagePicker/useLanguage'
import { getFullLanguage, isLanguage } from '@oodikone/shared/language'
import type { CloseToGraduationData } from '@oodikone/shared/routes/populations'

export type CloseToGraduationFilters = {
  faculties: string[]
  programmes: string[]
  isBaMa: boolean | null
  thesisCompleted: boolean | null
}

type MultiSelectFilterKey = 'faculties' | 'programmes'

export type FilterOption = { text: string; value: string; count: number }

export type CloseToGraduationFilterOptions = Record<MultiSelectFilterKey, FilterOption[]>

export type FilterDescription = { label: string; value: string }

export const emptyFilters: CloseToGraduationFilters = {
  faculties: [],
  programmes: [],
  isBaMa: null,
  thesisCompleted: null,
}

export const UNKNOWN_LANGUAGE = 'Unknown'

export const getPreferredLanguage = (languageCode: string) =>
  (isLanguage(languageCode) ? getFullLanguage(languageCode) : null) ?? UNKNOWN_LANGUAGE

const getFilterValues = (row: CloseToGraduationData, getTextIn: GetTextIn) => ({
  faculty: getTextIn(row.faculty, 'fi') ?? '',
  programme: row.programme.code,
  isBaMa: row.studyright.isBaMa,
  thesisCompleted: row.thesisInfo != null,
})

type FilterValues = ReturnType<typeof getFilterValues>

const multiSelectValueKeys = {
  faculties: 'faculty',
  programmes: 'programme',
} as const satisfies Record<MultiSelectFilterKey, keyof FilterValues>

const multiSelectFilterKeys = Object.keys(multiSelectValueKeys) as MultiSelectFilterKey[]

const matchesAny = (selected: string[], value: string) => selected.length === 0 || selected.includes(value)

const matchesBoolean = (selected: boolean | null, value: boolean) => selected === null || selected === value

const matchesFilters = (values: FilterValues, filters: CloseToGraduationFilters, ignoredKey?: MultiSelectFilterKey) =>
  multiSelectFilterKeys.every(
    key => key === ignoredKey || matchesAny(filters[key], values[multiSelectValueKeys[key]])
  ) &&
  matchesBoolean(filters.isBaMa, values.isBaMa) &&
  matchesBoolean(filters.thesisCompleted, values.thesisCompleted)

export const filterStudents = (
  rows: CloseToGraduationData[],
  filters: CloseToGraduationFilters,
  getTextIn: GetTextIn
) => rows.filter(row => matchesFilters(getFilterValues(row, getTextIn), filters))

const toSortedOptions = (options: Omit<FilterOption, 'count'>[], counts: Map<string, number>): FilterOption[] =>
  [...new Map(options.map(option => [option.value, option])).values()]
    .map(option => ({ ...option, count: counts.get(option.value) ?? 0 }))
    .sort((a, b) => a.text.localeCompare(b.text))

export const getFilterOptions = (
  rows: CloseToGraduationData[],
  filters: CloseToGraduationFilters,
  getTextIn: GetTextIn
): CloseToGraduationFilterOptions => {
  const rowsWithValues = rows.map(row => ({ row, values: getFilterValues(row, getTextIn) }))

  const countsFor = (key: MultiSelectFilterKey) => {
    const counts = new Map<string, number>()
    for (const { values } of rowsWithValues) {
      if (!matchesFilters(values, filters, key)) continue
      const value = values[multiSelectValueKeys[key]]
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
    return counts
  }
  const inSelectedFaculties = rowsWithValues.filter(({ values }) => matchesAny(filters.faculties, values.faculty))

  return {
    faculties: toSortedOptions(
      rowsWithValues.map(({ row, values }) => ({
        text: getTextIn(row.faculty) ?? values.faculty,
        value: values.faculty,
      })),
      countsFor('faculties')
    ),
    programmes: toSortedOptions(
      inSelectedFaculties.map(({ row, values }) => ({
        text: getTextIn(row.programme.name) ?? values.programme,
        value: values.programme,
      })),
      countsFor('programmes')
    ),
  }
}

const keepAvailable = (selected: string[], options: FilterOption[]) =>
  selected.filter(value => options.some(option => option.value === value))

export const pruneFilters = (
  rows: CloseToGraduationData[],
  filters: CloseToGraduationFilters,
  getTextIn: GetTextIn
): CloseToGraduationFilters => ({
  ...filters,
  programmes: keepAvailable(filters.programmes, getFilterOptions(rows, filters, getTextIn).programmes),
})

const describeSelection = (selected: string[], options: FilterOption[], whenNoneSelected: string) => {
  if (selected.length === 0) return whenNoneSelected
  return selected.map(value => options.find(option => option.value === value)?.text ?? value).join(', ')
}

const describeBoolean = (selected: boolean | null, descriptions: Record<'any' | 'yes' | 'no', string>) => {
  if (selected === null) return descriptions.any
  return selected ? descriptions.yes : descriptions.no
}

export const describeFilters = (
  filters: CloseToGraduationFilters,
  options: CloseToGraduationFilterOptions
): FilterDescription[] => [
  {
    label: 'Faculty',
    value: describeSelection(filters.faculties, options.faculties, 'all faculties'),
  },
  {
    label: 'Programme',
    value: describeSelection(
      filters.programmes,
      options.programmes,
      filters.faculties.length ? 'all programmes of the selected faculties' : 'all programmes'
    ),
  },
  {
    label: 'BSc & MSc study right',
    value: describeBoolean(filters.isBaMa, {
      any: 'all study rights',
      yes: 'only students with a combined study right',
      no: 'only students without a combined study right',
    }),
  },
  {
    label: 'Thesis completed',
    value: describeBoolean(filters.thesisCompleted, {
      any: 'all students',
      yes: 'only students with a completed thesis',
      no: 'only students without a completed thesis',
    }),
  },
]
