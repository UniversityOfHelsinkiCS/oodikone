import React from 'react'
import 'moment/locale/fi'
import DateRangeSelector from 'components/DateRangeSelector'
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
        <DateRangeSelector
          showSemesters
          value={[startDate, endDate]}
          onChange={([startDate, endDate]) =>
            onOptionsChange({
              startDate,
              endDate,
            })
          }
        />
      </div>
    </>
  )
}

const filter = createFilter({
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
      if (startDate && startDate.isAfter(course.date, 'day')) {
        return false
      }

      if (endDate && endDate.isBefore(course.date, 'day')) {
        return false
      }

      return true
    })

    return true
  },

  selectors: {
    // eslint-disable-next-line no-unused-vars
    selectedStartDate: ({ startDate }, _) => startDate,
  },

  component: CreditDateFilterCard,
})

export default filter

export const { selectedStartDate } = filter.selectors
