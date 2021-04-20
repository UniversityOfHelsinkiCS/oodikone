import React, { useState, useEffect } from 'react'
import { Form, Input, Label } from 'semantic-ui-react'
import { getStudentTotalCredits } from '../../../../common'
import FilterCard from '../common/FilterCard'
import useCreditFilter from './useCreditFilter'
import useFilters from '../../useFilters'
import useAnalytics from '../../useAnalytics'

export const contextKey = 'creditFilter'

export default () => {
  const { currentValue, requestedValue, setCurrentValue } = useCreditFilter()
  const { addFilter, removeFilter, activeFilters } = useFilters()
  const analytics = useAnalytics()
  const [updatedAt, setUpdatedAt] = useState({ min: null, max: null })
  const labels = { min: 'At Least', max: 'Less Than' }

  const now = () => new Date().getTime()

  const names = Object.fromEntries(Object.keys(currentValue).map(key => [key, `totalCredits${key}`]))

  const filterFunctions = limit => ({
    min: student => getStudentTotalCredits(student) >= Number(limit),
    max: student => getStudentTotalCredits(student) < Number(limit)
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

  // Listen for external filtering requests (from credit stats table rows).
  useEffect(() => {
    Object.keys(currentValue).forEach(key => {
      const newValue = requestedValue[key] === null ? '' : requestedValue[key]
      const name = names[key]
      setCurrentValue({ [key]: String(newValue) })

      if (newValue === '') {
        removeFilter(name)
      } else {
        addFilter(name, filterFunctions(newValue)[key])
      }
    })
  }, [requestedValue])

  const onChange = key => (_, { value }) => {
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

  return (
    <FilterCard
      title="Credits"
      active={active}
      className="total-credits-filter"
      contextKey={contextKey}
      name="credit-filter"
    >
      <Form>
        <div className="card-content">
          {Object.keys(currentValue).map(key => (
            <Form.Field key={`total-credits-filter-${key}`}>
              <Label style={{ marginBottom: '0.5rem' }}>{labels[key]}</Label>
              <Input
                size="mini"
                onChange={onChange(key)}
                value={currentValue[key]}
                onKeyDown={onKeyDown(key)}
                data-cy={`credit-filter-${key}`}
                style={{ width: '100px' }}
              />
            </Form.Field>
          ))}
        </div>
      </Form>
    </FilterCard>
  )
}
