import 'dayjs/locale/fi'

import { filterToolTips } from '@/common/InfoToolTips'
import { DateRangeSelector } from '@/components/common/DateRangeSelector'
import { createFilter } from '../createFilter'

/**
 * Filter courses according to the date when credits were earned.
 * Unlike other filters, this one does not filter out students from the population. Rather it
 * operates on the students' courses, filtering them according to the date range input.
 */
const CreditDateFilterCard = ({ options, onOptionsChange }) => {
  const { startDate, endDate } = options

  return (
    <div className="card-content" style={{ marginTop: '0.5rem' }}>
      <DateRangeSelector
        onChange={([startDate, endDate]) =>
          onOptionsChange({
            startDate,
            endDate,
          })
        }
        showSemesters
        value={[startDate, endDate]}
      />
    </div>
  )
}

export const creditDateFilter = createFilter({
  key: 'CreditDate',

  title: 'Date of course credits',

  info: filterToolTips.courseCredits,

  priority: 100,

  defaultOptions: {
    startDate: null,
    endDate: null,
  },

  isActive: ({ startDate, endDate }) => startDate !== null || endDate !== null,

  /**
   * startDate and endDate are both dayjs.Dayjs
   */
  filter(student, { options }) {
    const { startDate, endDate } = options

    student.courses = student.courses.filter(
      course => !startDate?.isAfter(course.date, 'day') && !endDate?.isBefore(course.date, 'day')
    )

    return true
  },

  selectors: {
    selectedStartDate: ({ startDate }, _) => startDate,
  },

  render: CreditDateFilterCard,
})
