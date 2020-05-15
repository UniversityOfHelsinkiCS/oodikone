import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Card, Form, Dropdown } from 'semantic-ui-react'

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

  const options = [
    { key: 'no-filter', text: 'No Filter', value: null },
    { key: 'female', text: `Female (${countsByGender[2]})`, value: 2 },
    { key: 'male', text: `Male (${countsByGender[1]})`, value: 1 }
  ]

  return (
    <Card>
      <Card.Content>
        <Card.Header>Gender</Card.Header>
        <Card.Description>
          <Form>
            <Dropdown
              selection
              fluid
              options={options}
              button
              className="mini"
              placeholder="No Filter"
              onChange={(_, { value: inputValue }) => setValue(inputValue)}
            />
          </Form>
        </Card.Description>
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
