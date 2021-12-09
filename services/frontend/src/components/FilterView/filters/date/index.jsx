import React from 'react'
import { Form } from 'semantic-ui-react'
import 'moment/locale/fi'
import DateTime from './DateTime'
import createFilter from '../createFilter'
import filterInfo from '../../../../common/InfoToolTips/filters'

/**
 * Filter courses according to the date when credits were earned.
 * Unlike other filters, this one does not filter out students from the population. Rather it
 * operates on the students' courses, filtering them according to the date range input.
 */
const CreditDateFilterCard = ({ options, onOptionsChange }) => {
  const { startDate, endDate } = options

  return (
    <>
      <div className="card-content" style={{ marginTop: '0.5rem' }}>
        <Form>
          <Form.Field>
            <label>Start Date:</label>
            <DateTime
              value={startDate}
              onChange={date =>
                onOptionsChange({
                  ...options,
                  startDate: date,
                })
              }
            />
          </Form.Field>
          <Form.Field>
            <label>End Date:</label>
            <DateTime
              value={endDate}
              onChange={date =>
                onOptionsChange({
                  ...options,
                  endDate: date,
                })
              }
            />
          </Form.Field>
        </Form>
      </div>
    </>
  )
}

export default createFilter({
  key: 'CreditDate',

  title: 'Date of Course Credits',

  info: filterInfo.courseCredits,

  priority: 100,

  defaultOptions: {
    startDate: null,
    endDate: null,
  },

  isActive: ({ startDate, endDate }) => startDate !== null || endDate !== null,

  filter(student, { startDate, endDate }) {
    student.courses = student.courses.filter(course => {
      if (startDate && startDate.isAfter(course.date)) {
        return false
      }

      if (endDate && endDate.isBefore(course.date)) {
        return false
      }

      return true
    })

    return true
  },

  component: CreditDateFilterCard,
})
