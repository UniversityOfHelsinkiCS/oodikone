import React from 'react'
import { Form, Dropdown } from 'semantic-ui-react'
import { createFilter } from './createFilter'

const GENDERS = {
  female: { label: 'Female', value: 2 },
  male: { label: 'Male', value: 1 },
  other: { label: 'Other', value: 3 },
  unknown: { label: 'Unknown', value: 0 },
}

const GenderFilterCard = ({ options, onOptionsChange, withoutSelf }) => {
  const { selected } = options

  const count = genderCode => withoutSelf().filter(student => Number(student.gender_code) === genderCode).length

  const dropdownOptions = Object.entries(GENDERS).map(([key, gender]) => ({
    key,
    text: `${gender.label} (${count(gender.value)})`,
    value: gender.value,
  }))

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
          options={dropdownOptions}
          placeholder="Choose gender"
          selectOnBlur={false}
          selection
          value={selected}
        />
      </Form>
    </div>
  )
}

export const genderFilter = createFilter({
  key: 'Gender',

  defaultOptions: {
    selected: '',
  },

  isActive: ({ selected }) => selected !== '',

  filter(student, { selected }) {
    return selected === Number(student.gender_code)
  },

  component: GenderFilterCard,
})
