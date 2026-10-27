import { useMemo } from 'react'

import { FilterSelect } from '@/components/FilterView/filters/common/FilterSelect'
import { createFilter, FilterTrayProps } from '@/components/FilterView/filters/createFilter'
import { filterToolTips } from '@/common/InfoToolTips'

type Options = { selected: string[] }
type Args = undefined
type Precompute = null

const NO_CURRICULUM = 'none'

const CurriculumPeriodFilterCard = ({
  options,
  onOptionsChange,
  students,
}: FilterTrayProps<Options, Args, Precompute>) => {
  const { selected } = options

  const dropdownOptions = useMemo(() => {
    const versionOptions = Array.from(
      new Set(students.map(({ curriculumVersion }) => curriculumVersion).filter(version => version !== null))
    )
      .sort((a, b) => b.localeCompare(a))
      .map(value => ({ key: value, text: value, value }))

    return students.some(({ curriculumVersion }) => curriculumVersion === null)
      ? [...versionOptions, { key: NO_CURRICULUM, text: 'None', value: NO_CURRICULUM }]
      : versionOptions
  }, [students])

  return (
    <FilterSelect
      filterKey="curriculumPeriodFilter"
      label="Choose curriculum periods"
      multiple
      onChange={({ target }) => onOptionsChange({ selected: target.value as string[] })}
      options={dropdownOptions}
      value={selected}
    />
  )
}

export const curriculumPeriodFilter = createFilter<Options, Args, Precompute>({
  key: 'CurriculumPeriod',

  info: filterToolTips.curriculumPeriod,

  title: 'Curriculum period',

  defaultOptions: {
    selected: [],
  },

  isActive: ({ selected }) => !!selected.length,

  filter({ curriculumVersion }, { options }) {
    const { selected } = options

    return selected.includes(curriculumVersion ?? NO_CURRICULUM)
  },

  render: CurriculumPeriodFilterCard,
})
