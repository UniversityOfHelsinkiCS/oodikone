import { Form, Dropdown } from 'semantic-ui-react'

import { createFilter } from './createFilter'

const GENDERS = {
  female: { label: 'Female', value: 2 },
  male: { label: 'Male', value: 1 },
  other: { label: 'Other', value: 3 },
  unknown: { label: 'Unknown', value: 0 },
}

const GenderFilterCard = ({ options, onOptionsChange, students }) => {
  const { selected } = options

  const count = (genderCode: number) => students.filter(student => Number(student.gender_code) === genderCode).length

  const dropdownOptions = Object.entries(GENDERS).map(([key, { label, value }]) => ({
    key,
    text: `${label} (${count(value)})`,
    value,
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

  title: 'Gender',

  defaultOptions: {
    selected: '',
  },

  isActive: ({ selected }) => selected !== '',

  filter(student, { options }) {
    const { selected } = options

    return Number(student.gender_code) === selected
  },

  render: GenderFilterCard,
})
