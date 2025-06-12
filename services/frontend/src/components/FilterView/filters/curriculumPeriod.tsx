import { orderBy } from 'lodash'
import { Form, Dropdown } from 'semantic-ui-react'

import { createFilter } from './createFilter'

const CurriculumPeriodFilterCard = ({ options, onOptionsChange, withoutSelf }) => {
  const { selected } = options

  const students = withoutSelf()
  const dropdownOptions = students.reduce((curriculumPeriods, { curriculumPeriod }) => {
    if (curriculumPeriods.every(option => option.value !== curriculumPeriod)) {
      const count = students.filter(({ curriculumVersion }) => curriculumVersion === curriculumPeriod).length

      curriculumPeriods.push({
        key: curriculumPeriod,
        value: curriculumPeriod,
        text: `${curriculumPeriod ?? 'No period selected'} (${count})`,
        count,
      })
    }

    return curriculumPeriods
  }, [])

  const sortedDropdownOptions = orderBy(dropdownOptions, ['text', 'count'], ['asc', 'desc'])

  return (
    <div className="card-content">
      <Form>
        <Dropdown
          button
          className="mini"
          clearable
          data-cy="curriculumPeriodFilter-dropdown"
          fluid
          onChange={(_, { value: inputValue }) => onOptionsChange({ selected: inputValue })}
          options={sortedDropdownOptions}
          placeholder="Choose curriculum period"
          selectOnBlur={false}
          selection
          value={selected}
        />
      </Form>
    </div>
  )
}

export const curriculumPeriodFilter = createFilter({
  key: 'Curriculum period',

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
