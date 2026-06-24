import { useMemo } from 'react'

import { FilterSelect } from '@/components/FilterView/filters/common/FilterSelect'
import { createFilter, FilterTrayProps } from '@/components/FilterView/filters/createFilter'

type Options = { selected: string }
type Args = undefined
type Precompute = null

const CurriculumPeriodFilterCard = ({
  options,
  onOptionsChange,
  students,
}: FilterTrayProps<Options, Args, Precompute>) => {
  const { selected } = options

  const dropdownOptions = useMemo(
    () =>
      Array.from(
        new Set(students.map(({ curriculumVersion }) => curriculumVersion).filter(version => version !== null))
      )
        .sort((a, b) => b.localeCompare(a))
        .map(value => ({ key: value, text: value, value })),
    [students]
  )

  return (
    <FilterSelect
      filterKey="curriculumPeriodFilter"
      label="Choose curriculum period"
      onChange={({ target }) => onOptionsChange({ selected: target.value })}
      options={dropdownOptions}
      value={selected}
    />
  )
}

export const curriculumPeriodFilter = createFilter<Options, Args, Precompute>({
  key: 'CurriculumPeriod',

  title: 'Curriculum period',

  defaultOptions: {
    selected: '',
  },

  isActive: ({ selected }) => !!selected,

  filter({ curriculumVersion }, { options }) {
    const { selected } = options

    return selected === curriculumVersion
  },

  render: CurriculumPeriodFilterCard,
})
