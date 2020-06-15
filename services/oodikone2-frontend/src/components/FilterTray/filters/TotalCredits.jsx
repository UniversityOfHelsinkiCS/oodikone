import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Input } from 'semantic-ui-react'
import { getStudentTotalCredits } from '../../../common'
import FilterCard from '../FilterCard'

const TotalCredits = ({ filterControl }) => {
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
    <FilterCard title="Total Credits">
      <Form>
        <Form.Field>
          <Input label="Min" size="mini" onChange={onChange('min')} value={value.min} />
        </Form.Field>
        <Form.Field>
          <Input label="Max" size="mini" onChange={onChange('max')} value={value.max} />
        </Form.Field>
      </Form>
    </FilterCard>
  )
}

TotalCredits.propTypes = {
  filterControl: PropTypes.shape({
    addFilter: PropTypes.func.isRequired,
    removeFilter: PropTypes.func.isRequired,
    withoutFilter: PropTypes.func.isRequired
  }).isRequired
}

export default TotalCredits
