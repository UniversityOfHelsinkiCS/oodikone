import React, { useState, useEffect } from 'react'
import { Form, Input, Label } from 'semantic-ui-react'
import { getStudentTotalCredits } from '../../../../common'
import useAnalytics from '../../useAnalytics'
import createFilter from '../createFilter'

export const contextKey = 'creditFilter'
const labels = { min: 'At Least', max: 'Less Than' }

const CreditsEarnedFilterCard = ({ options, onOptionsChange }) => {
  const [localOptions, setLocalOptions] = useState(options)
  const { min, max } = localOptions
  const analytics = useAnalytics()
  const [updatedAt, setUpdatedAt] = useState(null)

  const now = () => new Date().getTime()

  const updateFilters = () => {
    onOptionsChange({
      min,
      max,
    })

    if (min !== null) {
      analytics.setFilter('At Least', min)
    } else {
      analytics.clearFilter('At Least')
    }

    if (max !== null) {
      analytics.setFilter('Less than', max)
    } else {
      analytics.clearFilter('Less than')
    }
  }

  // Update filters automatically 2 sec after value change.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (updatedAt && now() - updatedAt > 1900) {
        updateFilters()
        setUpdatedAt(null)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [updatedAt])

  // Listen for external filtering requests (from credit stats table rows).
  // TODO: Reimplement using something else
  /* useEffect(() => {
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
  }, [requestedValue]) */

  const onChange =
    key =>
    (_, { value }) => {
      setLocalOptions({ ...localOptions, [key]: value })
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
        {['min', 'max'].map(key => (
          <Form.Field key={`total-credits-filter-${key}`}>
            <Label style={{ marginBottom: '0.5rem' }}>{labels[key]}</Label>
            <Input
              size="mini"
              onChange={onChange(key)}
              value={localOptions[key]}
              onKeyDown={onKeyDown}
              data-cy={`credit-filter-${key}`}
              style={{ width: '100px' }}
            />
          </Form.Field>
        ))}
      </div>
    </Form>
  )
}

export default createFilter({
  key: 'CreditsEarned',

  title: 'Credits Earned',

  defaultOptions: {
    min: null,
    max: null,
  },

  isActive: ({ min, max }) => min !== null || max !== null,

  filter(student, { min, max }) {
    const credits = getStudentTotalCredits(student)

    if (min !== null && credits < min) {
      return false
    }

    if (max !== null && credits > max) {
      return false
    }

    return true
  },

  component: CreditsEarnedFilterCard,
})
