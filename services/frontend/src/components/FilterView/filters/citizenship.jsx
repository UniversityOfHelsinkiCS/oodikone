import _ from 'lodash'
import React from 'react'
import { Form, Dropdown } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { createFilter } from './createFilter'

const CitizenshipFilterCard = ({ options, onOptionsChange, withoutSelf }) => {
  const { getTextIn } = useLanguage()
  const { selected } = options

  const dropdownOptions = withoutSelf().reduce((citizenships, student) => {
    const { home_country_en: homeCountryEn, home_country_fi: homeCountryFi, home_country_sv: homeCountrySv } = student

    if (citizenships.every(option => option.value !== homeCountryEn)) {
      const count = withoutSelf().filter(student => student.home_country_en === homeCountryEn).length
      const homeCountry = getTextIn({ fi: homeCountryFi, en: homeCountryEn, sv: homeCountrySv })

      citizenships.push({
        key: homeCountryEn,
        value: homeCountryEn,
        text: `${homeCountry} (${count})`,
        count,
      })
    }

    return citizenships
  }, [])

  const sortedDropdownOptions = _.orderBy(dropdownOptions, ['count', 'text'], ['desc', 'asc'])

  return (
    <div className="card-content">
      <Form>
        <Dropdown
          button
          className="mini"
          clearable
          data-cy="genderFilter-dropdown"
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

  isActive: ({ selected }) => selected !== '',

  filter(student, { selected }) {
    return selected === student.home_country_en
  },

  component: CitizenshipFilterCard,
})
