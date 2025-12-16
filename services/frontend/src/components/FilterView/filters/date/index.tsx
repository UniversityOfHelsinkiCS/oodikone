import 'dayjs/locale/fi'

import { filterToolTips } from '@/common/InfoToolTips'
import { DateRangeSelector } from '@/components/common/DateRangeSelector'
import { FilterTrayProps } from '../../FilterTray'
import { createFilter } from '../createFilter'

/**
 * Filter courses according to the date when credits were earned.
 * Unlike other filters, this one does not filter out students from the population. Rather it
 * operates on the students' courses, filtering them according to the date range input.
 */
const ParticipationDateFilterCard = ({ options, onOptionsChange }: FilterTrayProps) => {
  const { startDate, endDate } = options

  return (
    <div className="card-content">
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
  key: 'ParticipationDate',

  title: 'Date of course credits',

  info: filterToolTips.courseCredits,

  defaultOptions: {
    startDate: null,
    endDate: null,
  },

  isActive: ({ startDate, endDate }) => startDate !== null || endDate !== null,

  /**
   * startDate and endDate are both dayjs.Dayjs
   */
  filter() {
    return true
  },

  mutate(student, { options }) {
    const { startDate, endDate } = options

    return {
      ...student,
      courses: student.courses.filter(course => {
        const afterStart = startDate?.isBefore(course.date, 'day') ?? true
        const beforeEnd = endDate?.isAfter(course.date, 'day') ?? true

        return afterStart && beforeEnd
      }),
      enrollments: student.enrollments.filter(enrollment => {
        const afterStart = startDate?.isBefore(enrollment.enrollment_date_time, 'day') ?? true
        const beforeEnd = endDate?.isAfter(enrollment.enrollment_date_time, 'day') ?? true

        return afterStart && beforeEnd
      }),
    }
  },

  render: ParticipationDateFilterCard,
})
