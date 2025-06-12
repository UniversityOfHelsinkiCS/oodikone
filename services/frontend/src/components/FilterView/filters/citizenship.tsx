import { orderBy } from 'lodash'
import { Form, Dropdown } from 'semantic-ui-react'

import { filterToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { createFilter } from './createFilter'

const CitizenshipFilterCard = ({ options, onOptionsChange, withoutSelf }) => {
  const { getTextIn } = useLanguage()
  const { selected } = options

  const students = withoutSelf()
  const uniqueContryNames = new Map<string, string>(
    students.flatMap(({ citizenships }) => citizenships).map(citizenship => [citizenship.en, getTextIn(citizenship)])
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
    <div className="card-content">
      <Form>
        <Dropdown
          button
          className="mini"
          clearable
          data-cy="citizenshipFilter-dropdown"
          fluid
          onChange={(_, { value: inputValue }) => onOptionsChange({ selected: inputValue })}
          options={sortedDropdownOptions}
          placeholder="Choose citizenship"
          selectOnBlur={false}
          selection
          value={selected}
        />
      </Form>
    </div>
  )
}

export const citizenshipFilter = createFilter({
  key: 'Citizenship',

  defaultOptions: {
    selected: '',
  },

  info: filterToolTips.citizenship,

  isActive: ({ selected }) => selected !== '',

  filter(student, { options }) {
    const { selected } = options

    return student.citizenships.some(({ en: countryName }) => countryName === selected)
  },

  render: CitizenshipFilterCard,
})
