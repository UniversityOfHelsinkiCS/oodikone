import { filterToolTips } from '@/common/InfoToolTips'
import { FilterSelect } from './common/FilterSelect'
import { createFilter, FilterTrayProps } from './createFilter'

type Options = any
type Args = any
type Precompute = any

const StartYearAtUniFilterCard = ({
  options,
  onOptionsChange,
  students,
}: FilterTrayProps<Options, Args, Precompute>) => {
  const { selected } = options

  const countsByYear = {}
  for (const { started } of students) {
    const year = new Date(started).getFullYear()

    countsByYear[year] ??= 0
    countsByYear[year]++
  }

  const dropdownOptions = Object.entries(countsByYear).map(([year, count]) => ({
    key: `year-${year}`,
    text: `${year} (${count})`,
    value: Number(year),
  }))

  return (
    <FilterSelect
      filterKey="startYearAtUniFilter"
      label="Choose years to include"
      onChange={({ target }) => onOptionsChange({ selected: target.value })}
      options={dropdownOptions}
      value={selected}
    />
  )
}

export const startYearAtUniFilter = createFilter<Options, Args, Precompute>({
  key: 'startYearAtUniFilter',

  title: 'Starting year',

  defaultOptions: {
    selected: '',
  },

  info: filterToolTips.startingYear,

  isActive: ({ selected }) => !!selected,

  filter: (student, { options }) => {
    const { selected } = options

    return selected === new Date(student.started).getFullYear()
  },

  render: StartYearAtUniFilterCard,
})
