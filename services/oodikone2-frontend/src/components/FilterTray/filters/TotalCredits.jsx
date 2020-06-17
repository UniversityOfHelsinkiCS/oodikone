import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Input, Button, Label, Icon } from 'semantic-ui-react'
import { getStudentTotalCredits } from '../../../common'
import FilterCard from '../FilterCard'

const TotalCredits = ({ filterControl }) => {
  const [value, setValue] = useState({ min: '', max: '' })
  const [updatedAt, setUpdatedAt] = useState({ min: null, max: null })

  const now = () => new Date().getTime()

  const filterFunctions = {
    min: student => getStudentTotalCredits(student) >= Number(value.min),
    max: student => getStudentTotalCredits(student) <= Number(value.max)
  }

  const updateFilters = key => {
    const name = `totalCredits${key}`

    if (value[key] !== '') {
      filterControl.addFilter(name, filterFunctions[key])
    } else {
      filterControl.removeFilter(name)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      Object.keys(updatedAt).forEach(key => {
        if (updatedAt[key] && now() - updatedAt[key] > 1900) {
          updateFilters(key)
          setUpdatedAt(prev => ({ ...prev, [key]: null }))
        }
      })
    }, 2000)
    return () => clearTimeout(timer)
  }, [updatedAt])

  const onChange = key => (_, { value: inputValue }) => {
    setValue(prev => ({ ...prev, [key]: inputValue }))
    setUpdatedAt(prev => ({ ...prev, [key]: now() }))
  }

  const onSubmit = key => () => {
    setUpdatedAt(prev => ({ ...prev, [key]: null }))
    updateFilters(key)
  }

  return (
    <FilterCard title="Total Credits">
      <Form>
        <Form.Field>
          <Input labelPosition="left" size="mini" onChange={onChange('min')} value={value.min} action>
            <Label>Min</Label>
            <input />
            <Button type="submit" size="mini" color="green" icon onClick={onSubmit('min')}>
              <Icon name="check" />
            </Button>
            <Button type="submit" size="mini" color="red" icon disabled={!value.min}>
              <Icon name="close" />
            </Button>
          </Input>
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
