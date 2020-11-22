import React, { useState, useEffect } from 'react'
import { Form } from 'semantic-ui-react'
import Datetime from 'react-datetime'
import 'moment/locale/fi'
import ClearFilterButton from './common/ClearFilterButton'
import FilterCard from './common/FilterCard'
import useFilters from '../useFilters'

/**
 * Filter courses according to the date when credits were earned.
 * Unlike other filters, this one does not filter out students from the population. Rather it
 * operates on the students' courses, filtering them according to the date range input.
 */
export default () => {
  const { setCreditDateFilter } = useFilters()
  const label = 'Select Date'
  const [startDate, setStartDate] = useState(label)
  const [endDate, setEndDate] = useState(label)
  const name = 'dateFilter'

  useEffect(() => {
    const filterFn = course => {
      if (startDate !== label && startDate.isAfter(course.date)) {
        return false
      }

      if (endDate !== label && endDate.isBefore(course.date)) {
        return false
      }

      return true
    }

    setCreditDateFilter(filterFn)
  }, [startDate, endDate])

  const reset = () => {
    setStartDate(label)
    setEndDate(label)
  }

  const clearButtonDisabled = startDate === label && endDate === label

  return (
    <FilterCard
      title="Date of Course Credits"
      contextKey={name}
      footer={<ClearFilterButton disabled={clearButtonDisabled} onClick={reset} name={name} />}
      active={!clearButtonDisabled}
      name={name}
    >
      <div className="description-text">
        Include courses from the selected date range only. Does not filter out students.
      </div>
      <div className="card-content">
        <Form>
          <Form.Field>
            <label>Start Date:</label>
            <Datetime
              value={startDate}
              onChange={date => setStartDate(date)}
              timeFormat={false}
              locale="fi"
              closeOnSelect
            />
          </Form.Field>
          <Form.Field>
            <label>End Date:</label>
            <Datetime
              value={endDate}
              onChange={date => setEndDate(date)}
              timeFormat={false}
              locale="fi"
              closeOnSelect
            />
          </Form.Field>
        </Form>
      </div>
    </FilterCard>
  )
}
