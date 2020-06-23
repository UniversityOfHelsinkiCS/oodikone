import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form } from 'semantic-ui-react'
import { createStore, useStore } from 'react-hookstore'
import { getStudentTotalCredits } from '../../../common'
import FilterCard from './common/FilterCard'
import NumericInput from './common/NumericInput'

createStore('totalCreditsExternal', { min: null, max: null })

const TotalCredits = ({ filterControl }) => {
  const [totalCreditsExternal] = useStore('totalCreditsExternal')
  const [value, setValue] = useState({ min: '', max: '' })
  const [updatedAt, setUpdatedAt] = useState({ min: null, max: null })
  const labels = { min: 'Min', max: 'Max' }

  const now = () => new Date().getTime()

  const names = Object.fromEntries(Object.keys(value).map(key => [key, `totalCredits${key}`]))

  const filterFunctions = limit => ({
    min: student => getStudentTotalCredits(student) >= Number(limit),
    max: student => getStudentTotalCredits(student) <= Number(limit)
  })

  const updateFilters = key => {
    const name = names[key]

    if (value[key] !== '') {
      filterControl.addFilter(name, filterFunctions(value[key])[key])
    } else {
      filterControl.removeFilter(name)
    }
  }

  // Update filters automatically 2 sec after value change.
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

  // Listen to hook-store for external filtering requests.
  useEffect(() => {
    console.log('totalCreditsExternal', totalCreditsExternal)
    Object.keys(value).forEach(key => {
      const newValue =
        totalCreditsExternal[key] === null || totalCreditsExternal[key] === undefined ? '' : totalCreditsExternal[key]
      const name = names[key]
      setValue(prev => ({ ...prev, [key]: String(newValue) }))

      if (newValue === '') {
        filterControl.removeFilter(name)
      } else {
        filterControl.addFilter(name, filterFunctions(newValue)[key])
      }
    })
  }, [totalCreditsExternal])

  useEffect(() => {
    console.log(filterControl.activeFilters);
  }, filterControl.activeFilters)

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
        {Object.keys(value).map(key => (
          <Form.Field key={`total-credits-filter-${key}`}>
            <NumericInput
              onChange={onChange(key)}
              onKeyDown={onKeyDown(key)}
              onClear={onClear(key)}
              value={value[key]}
              label={labels[key]}
              clearButtonDisabled={clearButtonDisabled(key)}
            />
          </Form.Field>
        ))}
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
