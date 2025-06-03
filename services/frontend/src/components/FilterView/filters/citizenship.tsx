import { orderBy } from 'lodash'
import { Form, Dropdown } from 'semantic-ui-react'

import { filterToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { createFilter } from './createFilter'

const CitizenshipFilterCard = ({ options, onOptionsChange, withoutSelf }) => {
  const { getTextIn } = useLanguage()
  const { selected } = options

  const dropdownOptions = withoutSelf().reduce((options, student) => {
    student.citizenships
      .filter(({ en: countryName }) => !options.some(option => option.value === countryName))
      .forEach(citizenship => {
        const countryName = citizenship.en
        const country = getTextIn(citizenship)

        const count = withoutSelf().filter(({ citizenships: otherCitizenships }) =>
          otherCitizenships.some(({ en: otherCountryName }) => otherCountryName === countryName)
        ).length

        options.push({
          key: countryName,
          value: countryName,
          text: `${country} (${count})`,
          count,
        })
      })

    return options
  }, [])

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

  filter(student, { selected }) {
    return student.citizenships.some(({ en: countryName }) => countryName === selected)
  },

  render: CitizenshipFilterCard,
})
