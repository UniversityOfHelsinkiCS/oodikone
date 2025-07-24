import { useMemo } from 'react'

import { FilterTrayProps } from '../FilterTray'
import { FilterSelect } from './common/FilterSelect'
import { createFilter } from './createFilter'

const CurriculumPeriodFilterCard = ({ options, onOptionsChange, students }: FilterTrayProps) => {
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

export const curriculumPeriodFilter = createFilter({
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
