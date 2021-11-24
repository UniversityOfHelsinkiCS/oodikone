import React, { useState, useEffect } from 'react'
import { Form, Label, Input } from 'semantic-ui-react'
import FilterCard from '../common/FilterCard'
import useAgeFilter from './useAgeFilter'
import useFilters from '../../useFilters'
import useAnalytics from '../../useAnalytics'

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

const AgeFilter = () => {
  const { currentValue, setCurrentValue } = useAgeFilter()
  const { addFilter, removeFilter, activeFilters } = useFilters()
  const analytics = useAnalytics()
  const [updatedAt, setUpdatedAt] = useState({ min: null, max: null })
  const labels = { min: 'At Least', max: 'Less Than' }

  const now = () => new Date().getTime()

  const names = Object.fromEntries(Object.keys(currentValue).map(key => [key, `age${key}`]))

  const filterFunctions = limit => ({
    min: student => getAge(student.birthdate) >= Number(limit),
    max: student => getAge(student.birthdate) < Number(limit),
  })

  const updateFilters = key => {
    const name = names[key]

    if (currentValue[key] !== '') {
      addFilter(name, filterFunctions(currentValue[key])[key])
      analytics.setFilter(name, currentValue[key])
    } else {
      removeFilter(name)
      analytics.clearFilter(name)
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

  const onChange =
    key =>
    (_, { value }) => {
      setCurrentValue({ [key]: value })
      setUpdatedAt(prev => ({ ...prev, [key]: now() }))
    }

  const onKeyDown = key => event => {
    if (event.keyCode === 13) {
      event.preventDefault()
      setUpdatedAt(prev => ({ ...prev, [key]: null }))
      updateFilters(key)
    }
  }

  const active = Object.values(names).some(name => Object.keys(activeFilters).includes(name))

  const infoText = null

  return (
    <FilterCard
      title="Age"
      active={active}
      className="total-age-filter"
      contextKey={contextKey}
      name="ageFilter"
      info={infoText}
    >
      <Form>
        <div className="card-content">
          {Object.keys(currentValue).map(key => (
            <Form.Field key={`total-age-filter-${key}`}>
              <Label style={{ marginBottom: '0.5rem' }}>{labels[key]}</Label>
              <Input
                size="mini"
                onChange={onChange(key)}
                value={currentValue[key]}
                onKeyDown={onKeyDown(key)}
                data-cy={`ageFilter-${key}`}
                style={{ width: '100px' }}
              />
            </Form.Field>
          ))}
        </div>
      </Form>
    </FilterCard>
  )
}

export default AgeFilter
