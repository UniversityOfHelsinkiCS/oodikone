import _ from 'lodash'
import React from 'react'
import { Form, Dropdown } from 'semantic-ui-react'

import { createFilter } from './createFilter'

const CurriculumVersionFilterCard = ({ options, onOptionsChange, withoutSelf }) => {
  const { selected } = options

  const dropdownOptions = withoutSelf().reduce((curriculumVersions, student) => {
    const { curriculumVersion } = student

    if (curriculumVersions.every(option => option.value !== curriculumVersion)) {
      const count = withoutSelf().filter(student => student.curriculumVersion === curriculumVersion).length

      curriculumVersions.push({
        key: curriculumVersion,
        value: curriculumVersion,
        text: `${curriculumVersion || 'No curriculum selected'} (${count})`,
        count,
      })
    }

    return curriculumVersions
  }, [])

  const sortedDropdownOptions = _.orderBy(dropdownOptions, ['text', 'count'], ['asc', 'desc'])

  return (
    <div className="card-content">
      <Form>
        <Dropdown
          button
          className="mini"
          clearable
          data-cy="curriculumVersionFilter-dropdown"
          fluid
          onChange={(_, { value: inputValue }) => onOptionsChange({ selected: inputValue })}
          options={sortedDropdownOptions}
          placeholder="Choose curriculum version"
          selectOnBlur={false}
          selection
          value={selected}
        />
      </Form>
    </div>
  )
}

export const curriculumVersionFilter = createFilter({
  key: 'Curriculum version',

  defaultOptions: {
    selected: '',
  },

  isActive: ({ selected }) => selected !== '',

  filter(student, { selected }) {
    return selected === student.curriculumVersion
  },

  component: CurriculumVersionFilterCard,
})
