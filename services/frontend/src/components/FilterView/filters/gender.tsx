import { FilterTrayProps } from '../FilterTray'
import { FilterSelect } from './common/FilterSelect'
import { createFilter } from './createFilter'

const GENDERS = {
  female: { label: 'Female', value: 2 },
  male: { label: 'Male', value: 1 },
  other: { label: 'Other', value: 3 },
  unknown: { label: 'Unknown', value: 0 },
}

const GenderFilterCard = ({ options, onOptionsChange, students }: FilterTrayProps) => {
  const { selected } = options

  const count = (genderCode: number) => students.filter(student => Number(student.gender_code) === genderCode).length

  const dropdownOptions = Object.entries(GENDERS).map(([key, { label, value }]) => ({
    key,
    text: `${label} (${count(value)})`,
    value,
  }))

  return (
    <FilterSelect
      filterKey="genderFilter"
      label="Choose gender"
      onChange={({ target }) => onOptionsChange({ selected: target.value })}
      options={dropdownOptions}
      value={selected}
    />
  )
}

export const genderFilter = createFilter({
  key: 'Gender',

  title: 'Gender',

  defaultOptions: {
    selected: '',
  },

  isActive: ({ selected }) => !!selected,

  filter(student, { options }) {
    const { selected } = options

    return Number(student.gender_code) === selected
  },

  render: GenderFilterCard,
})
