import React, { useState, useEffect } from 'react'
import { Card, Form, Dropdown } from 'semantic-ui-react'

export default ({ filterControl }) => {
  const [value, setValue] = useState([])

  useEffect(() => {
    const name = 'gender'

    if (value.length === 0) {
      filterControl.removeFilter(name)
    } else {
      filterControl.addFilter(name, student => value.some(gender => gender === student.gender_code))
    }
  }, [value])

  const options = [{ key: 'female', text: 'Female', value: 2 }, { key: 'male', text: 'Male', value: 1 }]

  return (
    <Card>
      <Card.Content>
        <Card.Header>Sex</Card.Header>
        <Card.Description>
          <Form>
            <Dropdown
              multiple
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
