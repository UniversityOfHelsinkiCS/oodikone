import React, { useState, useEffect } from 'react'
import { Form, Label, Input } from 'semantic-ui-react'
import createFilter from './createFilter'

export const contextKey = 'ageFilter'

const getAge = toDate => {
  const today = new Date()
  const birthDate = new Date(toDate)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

const AgeFilterCard = ({ options, onOptionsChange }) => {
  const [currentValue, setCurrentValue] = useState(options)
  const [updatedAt, setUpdatedAt] = useState(null)

  // const { currentValue, setCurrentValue } = useAgeFilter()
  // const { addFilter, removeFilter, activeFilters } = useFilters()

  const labels = { min: 'At Least', max: 'Less Than' }

  const now = () => new Date().getTime()

  const updateFilters = () => {
    onOptionsChange({ ...currentValue })
  }

  useEffect(() => {
    setCurrentValue({
      min: options.min,
      max: options.max,
    })
  }, [options.min, options.max])

  // Update filters automatically 2 sec after value change.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (updatedAt !== null && now() - updatedAt > 1900) {
        updateFilters()
        setUpdatedAt(null)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [updatedAt])

  const onChange =
    key =>
    (_, { value }) => {
      setCurrentValue(prev => ({ ...prev, [key]: value }))
      setUpdatedAt(now())
    }

  const onKeyDown = event => {
    if (event.keyCode === 13) {
      event.preventDefault()
      setUpdatedAt(null)
      updateFilters()
    }
  }

  return (
    <Form>
      <div className="card-content">
        {Object.keys(currentValue).map(key => (
          <Form.Field key={`total-age-filter-${key}`}>
            <Label style={{ marginBottom: '0.5rem' }}>{labels[key]}</Label>
            <Input
              size="mini"
              onChange={onChange(key)}
              value={currentValue[key] ?? ''}
              onKeyDown={onKeyDown}
              data-cy={`ageFilter-${key}`}
              style={{ width: '100px' }}
            />
          </Form.Field>
        ))}
      </div>
    </Form>
  )
}

export default createFilter({
  key: 'Age',

  defaultOptions: {
    min: null,
    max: null,
  },

  isActive: ({ min, max }) => min !== null || max !== null,

  filter: (student, { min, max }) => {
    const age = getAge(student.birthdate)

    if (min !== null && min > age) {
      return false
    }

    if (max !== null && max < age) {
      return false
    }

    return true
  },

  component: AgeFilterCard,
})
