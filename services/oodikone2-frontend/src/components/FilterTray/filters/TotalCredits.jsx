import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Input, Button, Label, Icon, Popup } from 'semantic-ui-react'
import { getStudentTotalCredits } from '../../../common'
import FilterCard from '../FilterCard'

const TotalCredits = ({ filterControl }) => {
  const [value, setValue] = useState({ min: '', max: '' })
  const [updatedAt, setUpdatedAt] = useState({ min: null, max: null })

  const now = () => new Date().getTime()

  const names = Object.fromEntries(Object.keys(value).map(key => [key, `totalCredits${key}`]))

  const filterFunctions = {
    min: student => getStudentTotalCredits(student) >= Number(value.min),
    max: student => getStudentTotalCredits(student) <= Number(value.max)
  }

  const updateFilters = key => {
    const name = names[key]

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

  const onKeyDown = key => event => {
    if (event.keyCode === 13) {
      event.preventDefault()
      setUpdatedAt(prev => ({ ...prev, [key]: null }))
      updateFilters(key)
    }
  }

  const onClear = key => () => {
    setValue(prev => ({ ...prev, [key]: '' }))
    setUpdatedAt(prev => ({ ...prev, [key]: null }))
    filterControl.removeFilter(names[key])
  }

  const clearButtonDisabled = key => !Object.keys(filterControl.activeFilters).includes(names[key])

  return (
    <FilterCard title="Total Credits">
      <Form>
        <Form.Field>
          <Input
            labelPosition="left"
            size="mini"
            onChange={onChange('min')}
            value={value.min}
            action
            onKeyDown={onKeyDown('min')}
          >
            <Label>Min</Label>
            <input />
            <Popup
              content="Clear filter."
              position="bottom center"
              pinned
              size="mini"
              on="hover"
              trigger={
                <Button size="mini" color="red" icon onClick={onClear('min')} disabled={clearButtonDisabled('min')}>
                  <Icon name="close" />
                </Button>
              }
            />
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
    withoutFilter: PropTypes.func.isRequired,
    activeFilters: PropTypes.object.isRequired
  }).isRequired
}

export default TotalCredits
