import React, { useState, useEffect } from 'react'
import { Form } from 'semantic-ui-react'
import 'moment/locale/fi'
import FilterCard from '../common/FilterCard'
import useFilters from '../../useFilters'
import DateTime from './DateTime'

/**
 * Filter courses according to the date when credits were earned.
 * Unlike other filters, this one does not filter out students from the population. Rather it
 * operates on the students' courses, filtering them according to the date range input.
 */
export default () => {
  const { setCreditDateFilter } = useFilters()
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const name = 'creditDateFilter'

  useEffect(() => {
    const filterFn = course => {
      if (startDate && startDate.isAfter(course.date)) {
        return false
      }

      if (endDate && endDate.isBefore(course.date)) {
        return false
      }

      return true
    }

    setCreditDateFilter({
      func: filterFn,
      startDate,
      endDate,
    })
  }, [startDate, endDate])


  const infoText = {
    label: 'Selected date range only.',
    short: 'Include course credits from the selected date range only. Does not filter out students.',
  }

  return (
    <FilterCard title="Date of Course Credits" contextKey={name} active={startDate || endDate} name={name} info={infoText}>
      <div className="card-content" style={{ marginTop: '0.5rem' }}>
        <Form>
          <Form.Field>
            <label>Start Date:</label>
            <DateTime value={startDate} onChange={date => setStartDate(date)} />
          </Form.Field>
          <Form.Field>
            <label>End Date:</label>
            <DateTime value={endDate} onChange={date => setEndDate(date)} />
          </Form.Field>
        </Form>
      </div>
    </FilterCard>
  )
}

// <div className="description-text"></div>
// Include course credits from the selected date range only. Does not filter out students.
