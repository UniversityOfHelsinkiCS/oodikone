import React, { useState, useEffect } from 'react'
import { Card, Form, Input } from 'semantic-ui-react'
import { getStudentTotalCredits } from '../../../common'

export default ({ filterControl }) => {
  const [value, setValue] = useState({ min: '', max: '' })

  const filterFunctions = {
    min: student => getStudentTotalCredits(student) >= Number(value.min),
    max: student => getStudentTotalCredits(student) <= Number(value.max)
  }

  useEffect(() => {
    Object.keys(value).forEach(key => {
      const name = `totalCredits${key}`

      if (value[key] !== '') {
        filterControl.addFilter(name, filterFunctions[key])
      } else {
        filterControl.removeFilter(name)
      }
    })
  }, [value])

  const onChange = key => (_, { value: inputValue }) => setValue(prev => ({ ...prev, [key]: inputValue }))

  return (
    <Card>
      <Card.Content>
        <Card.Header>Total Credits</Card.Header>
        <Card.Description>
          <Form>
            <Form.Field>
              <Input label="Min" size="mini" onChange={onChange('min')} value={value.min} />
            </Form.Field>
            <Form.Field>
              <Input label="Max" size="mini" onChange={onChange('max')} value={value.max} />
            </Form.Field>
          </Form>
        </Card.Description>
      </Card.Content>
    </Card>
  )
}
