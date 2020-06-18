import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Radio } from 'semantic-ui-react'
import ClearFilterButton from './common/ClearFilterButton'
import FilterCard from './common/FilterCard'

const Gender = ({ filterControl }) => {
  const { addFilter, removeFilter, withoutFilter } = filterControl
  const [value, setValue] = useState(null)
  const name = 'gender'

  useEffect(() => {
    if (!value) {
      removeFilter(name)
    } else {
      addFilter(name, student => value === student.gender_code)
    }
  }, [value])

  const countsByGender = {}
  withoutFilter(name).forEach(student => {
    const gc = student.gender_code
    countsByGender[gc] = countsByGender[gc] ? countsByGender[gc] + 1 : 1
  })

  // Using this prevents showing undefined.
  const formatCount = count => (count ? `(${count})` : '')

  const options = [
    { key: 'female', text: `Female ${formatCount(countsByGender[2])}`, value: 2 },
    { key: 'male', text: `Male ${formatCount(countsByGender[1])}`, value: 1 }
  ]

  return (
    <FilterCard title="Gender" footer={<ClearFilterButton disabled={!value} onClick={() => setValue(null)} />}>
      <Form>
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

Gender.propTypes = {
  filterControl: PropTypes.shape({
    addFilter: PropTypes.func.isRequired,
    removeFilter: PropTypes.func.isRequired,
    withoutFilter: PropTypes.func.isRequired
  }).isRequired
}

export default Gender
