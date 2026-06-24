import { orderBy } from 'lodash-es'

import { filterToolTips } from '@/common/InfoToolTips'
import { FilterSelect } from '@/components/FilterView/filters/common/FilterSelect'
import { createFilter, FilterTrayProps } from '@/components/FilterView/filters/createFilter'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'

type Options = { selected: string }
type Args = undefined
type Precompute = null

const CitizenshipFilterCard = ({ options, onOptionsChange, students }: FilterTrayProps<Options, Args, Precompute>) => {
  const { getTextIn } = useLanguage()
  const { selected } = options

  const uniqueContryNames = new Map<string, string>(
    students
      .flatMap(({ citizenships }) => citizenships)
      .filter(citizenship => !!citizenship.en)
      .map(citizenship => [citizenship.en!, getTextIn(citizenship)!])
  )

  const dropdownOptions = [] as any[]
  for (const [countryName, country] of uniqueContryNames.entries()) {
    const count = students.filter(({ citizenships: otherCitizenships }) =>
      otherCitizenships.some(({ en: otherCountryName }) => otherCountryName === countryName)
    ).length

    dropdownOptions.push({
      key: countryName,
      value: countryName,
      text: `${country} (${count})`,
      count,
    })
  }

  const sortedDropdownOptions = orderBy(dropdownOptions, ['count', 'text'], ['desc', 'asc'])

  return (
    <FilterSelect
      filterKey="citizenshipFilter"
      label="Choose citizenship"
      onChange={({ target }) => onOptionsChange({ selected: target.value })}
      options={sortedDropdownOptions}
      value={selected}
    />
  )
}

export const citizenshipFilter = createFilter<Options, Args, Precompute>({
  key: 'Citizenship',

  title: 'Citizenship',

  defaultOptions: {
    selected: '',
  },

  info: filterToolTips.citizenship,

  isActive: ({ selected }) => !!selected,

  filter(student, { options }) {
    const { selected } = options

    return student.citizenships.some(({ en: countryName }) => countryName === selected)
  },

  render: CitizenshipFilterCard,
})
