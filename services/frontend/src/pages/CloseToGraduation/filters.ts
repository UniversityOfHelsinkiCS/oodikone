import type { GetTextIn } from '@/components/LanguagePicker/useLanguage'
import { getFullLanguage, isLanguage } from '@oodikone/shared/language'
import type { CloseToGraduationData } from '@oodikone/shared/routes/populations'

export type CloseToGraduationFilters = {
  faculties: string[]
  programmes: string[]
  studyTracks: string[]
  isBaMa: boolean | null
  thesisCompleted: boolean | null
}

type MultiSelectFilterKey = 'faculties' | 'programmes' | 'studyTracks'

export type FilterOption = { text: string; value: string; count: number }

export type CloseToGraduationFilterOptions = Record<MultiSelectFilterKey, FilterOption[]>

export type FilterDescription = { label: string; value: string }

export const emptyFilters: CloseToGraduationFilters = {
  faculties: [],
  programmes: [],
  studyTracks: [],
  isBaMa: null,
  thesisCompleted: null,
}

export const UNKNOWN_LANGUAGE = 'Unknown'

export const getPreferredLanguage = (languageCode: string) =>
  (isLanguage(languageCode) ? getFullLanguage(languageCode) : null) ?? UNKNOWN_LANGUAGE

const getFilterValues = (row: CloseToGraduationData) => ({
  faculty: row.faculty.code,
  programme: row.programme.code,
  studyTrack: row.programme.studyTrack?.code ?? '',
  isBaMa: row.studyright.isBaMa,
  thesisCompleted: row.thesisInfo != null,
})

type FilterValues = ReturnType<typeof getFilterValues>

const multiSelectValueKeys = {
  faculties: 'faculty',
  programmes: 'programme',
  studyTracks: 'studyTrack',
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

export const filterStudents = (rows: CloseToGraduationData[], filters: CloseToGraduationFilters) =>
  rows.filter(row => matchesFilters(getFilterValues(row), filters))

const toSortedOptions = (options: Omit<FilterOption, 'count'>[], counts: Map<string, number>): FilterOption[] =>
  [...new Map(options.map(option => [option.value, option])).values()]
    .map(option => ({ ...option, count: counts.get(option.value) ?? 0 }))
    .sort((a, b) => a.text.localeCompare(b.text))

export const getFilterOptions = (
  rows: CloseToGraduationData[],
  filters: CloseToGraduationFilters,
  getTextIn: GetTextIn
): CloseToGraduationFilterOptions => {
  const rowsWithValues = rows.map(row => ({ row, values: getFilterValues(row) }))

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
  const inSelectedProgrammes = inSelectedFaculties.filter(({ values }) =>
    matchesAny(filters.programmes, values.programme)
  )

  return {
    faculties: toSortedOptions(
      rowsWithValues.map(({ row, values }) => ({
        text: getTextIn(row.faculty.name) ?? values.faculty,
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
    studyTracks: toSortedOptions(
      inSelectedProgrammes
        .filter(({ values }) => values.studyTrack !== '')
        .map(({ row, values }) => ({
          text: getTextIn(row.programme.studyTrack?.name) ?? values.studyTrack,
          value: values.studyTrack,
        })),
      countsFor('studyTracks')
    ),
  }
}

const keepAvailable = (selected: string[], options: FilterOption[]) =>
  selected.filter(value => options.some(option => option.value === value))

export const pruneFilters = (
  rows: CloseToGraduationData[],
  filters: CloseToGraduationFilters,
  getTextIn: GetTextIn
): CloseToGraduationFilters => {
  const programmes = keepAvailable(filters.programmes, getFilterOptions(rows, filters, getTextIn).programmes)
  const withPrunedProgrammes = { ...filters, programmes }
  return {
    ...withPrunedProgrammes,
    studyTracks: keepAvailable(
      filters.studyTracks,
      getFilterOptions(rows, withPrunedProgrammes, getTextIn).studyTracks
    ),
  }
}

export const FILTER_QUERY_PARAMS = {
  faculties: 'faculty',
  programmes: 'programme',
  studyTracks: 'studytrack',
} as const satisfies Record<MultiSelectFilterKey, string>

export const getFiltersFromSearchParams = (
  rows: CloseToGraduationData[],
  searchParams: URLSearchParams,
  getTextIn: GetTextIn
): CloseToGraduationFilters => {
  const rowValues = rows.map(getFilterValues)
  const knownValuesFor = (key: MultiSelectFilterKey) =>
    new Set(rowValues.map(values => values[multiSelectValueKeys[key]]).filter(Boolean))
  const knownParamValuesFor = (key: MultiSelectFilterKey) => {
    const knownValues = knownValuesFor(key)
    return [...new Set(searchParams.getAll(FILTER_QUERY_PARAMS[key]))].filter(value => knownValues.has(value))
  }

  const filters: CloseToGraduationFilters = {
    ...emptyFilters,
    faculties: knownParamValuesFor('faculties'),
    programmes: knownParamValuesFor('programmes'),
    studyTracks: knownParamValuesFor('studyTracks'),
  }
  return pruneFilters(rows, filters, getTextIn)
}

export const countMultiSelectFilters = (filters: CloseToGraduationFilters) =>
  multiSelectFilterKeys.filter(key => filters[key].length > 0).length

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
    label: 'Study track',
    value: describeSelection(
      filters.studyTracks,
      options.studyTracks,
      filters.faculties.length || filters.programmes.length
        ? 'all study tracks of the selected programmes'
        : 'all study tracks'
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
