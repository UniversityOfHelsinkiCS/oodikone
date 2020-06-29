import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Radio } from 'semantic-ui-react'
import FilterCard from './common/FilterCard'
import ClearFilterButton from './common/ClearFilterButton'

const StartingSemester = ({ filterControl }) => {
  const { addFilter, removeFilter, withoutFilter, activeFilters } = filterControl
  const [value, setValue] = useState(null)
  const name = 'startingSemesterFilter'

  useEffect(() => {
    if (value === null) {
      removeFilter(name)
    } else {
      addFilter(name, student => student.starting === (value === 1))
    }
  }, [value])

  const count = starting => withoutFilter(name).filter(student => student.starting === starting).length

  const options = [
    { key: 'during-this-semester', text: `During This Semester (${count(true)})`, value: 1 },
    { key: 'before-this-semester', text: `Before This Semester (${count(false)})`, value: 2 }
  ]

  return (
    <FilterCard
      title="Starting Semester"
      footer={<ClearFilterButton disabled={!value} onClick={() => setValue(null)} />}
      active={Object.keys(activeFilters).includes(name)}
    >
      <Form>
        <div className="description-text">Show students who started:</div>
        {options.map(opt => (
          <Form.Field key={opt.key}>
            <Radio
              label={opt.text}
              value={opt.value}
              checked={value === opt.value}
              onChange={(_, { value: inputValue }) => setValue(inputValue)}
            />
          </Form.Field>
        ))}
      </Form>
    </FilterCard>
  )
}

StartingSemester.propTypes = {
  filterControl: PropTypes.shape({
    addFilter: PropTypes.func.isRequired,
    removeFilter: PropTypes.func.isRequired,
    withoutFilter: PropTypes.func.isRequired,
    activeFilters: PropTypes.object.isRequired
  }).isRequired
}

export default StartingSemester
