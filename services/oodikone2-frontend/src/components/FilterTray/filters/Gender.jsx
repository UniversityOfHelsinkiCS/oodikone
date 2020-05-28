import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Card, Form, Radio } from 'semantic-ui-react'
import ClearFilterButton from '../ClearFilterButton'

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
    <Card>
      <Card.Content>
        <Card.Header>Gender</Card.Header>
        <Card.Description>
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
        </Card.Description>
      </Card.Content>
      <Card.Content extra>
        <ClearFilterButton disabled={!value} onClick={() => setValue(null)} />
      </Card.Content>
    </Card>
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
