import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getTranslate } from 'react-localize-redux'
import { getStudentTotalCredits } from '../../../../common'
import FilterCard from '../common/FilterCard'
import NumericInput from '../common/NumericInput'
import useCreditFilter from './useCreditFilter'

export const contextKey = 'creditFilter'

const CreditsEarned = ({ filterControl, translate }) => {
  const { currentValue, requestedValue, setCurrentValue } = useCreditFilter()
  const [updatedAt, setUpdatedAt] = useState({ min: null, max: null })
  const labels = { min: translate('creditFilter.labelMin'), max: translate('creditFilter.labelMax') }

  const now = () => new Date().getTime()

  const names = Object.fromEntries(Object.keys(currentValue).map(key => [key, `totalCredits${key}`]))

  const filterFunctions = limit => ({
    min: student => getStudentTotalCredits(student) >= Number(limit),
    max: student => getStudentTotalCredits(student) < Number(limit)
  })

  const updateFilters = key => {
    const name = names[key]

    if (currentValue[key] !== '') {
      filterControl.addFilter(name, filterFunctions(currentValue[key])[key])
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

  // Listen for external filtering requests (from credit stats table rows).
  useEffect(() => {
    Object.keys(currentValue).forEach(key => {
      const newValue = requestedValue[key] === null ? '' : requestedValue[key]
      const name = names[key]
      setCurrentValue({ [key]: String(newValue) })

      if (newValue === '') {
        filterControl.removeFilter(name)
      } else {
        filterControl.addFilter(name, filterFunctions(newValue)[key])
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

  const onClear = key => () => {
    setCurrentValue({ [key]: '' })
    setUpdatedAt(prev => ({ ...prev, [key]: null }))
    filterControl.removeFilter(names[key])
  }

  const clearButtonDisabled = key => !Object.keys(filterControl.activeFilters).includes(names[key])

  const active = Object.values(names).some(name => Object.keys(filterControl.activeFilters).includes(name))

  return (
    <FilterCard title="Credits Earned" active={active} className="total-credits-filter" contextKey={contextKey}>
      <Form>
        <div className="description-text">{translate('creditFilter.description')}</div>
        {Object.keys(currentValue).map(key => (
          <Form.Field key={`total-credits-filter-${key}`}>
            <NumericInput
              onChange={onChange(key)}
              onKeyDown={onKeyDown(key)}
              onClear={onClear(key)}
              value={currentValue[key]}
              label={labels[key]}
              clearButtonDisabled={clearButtonDisabled(key)}
            />
          </Form.Field>
        ))}
      </Form>
    </FilterCard>
  )
}

CreditsEarned.propTypes = {
  filterControl: PropTypes.shape({
    addFilter: PropTypes.func.isRequired,
    removeFilter: PropTypes.func.isRequired,
    withoutFilter: PropTypes.func.isRequired,
    activeFilters: PropTypes.object.isRequired
  }).isRequired,
  translate: PropTypes.func.isRequired
}

const mapStateToProps = ({ localize }) => ({ translate: getTranslate(localize) })

export default connect(mapStateToProps)(CreditsEarned)
