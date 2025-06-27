import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { Table } from 'semantic-ui-react'

import { getStudentTotalCredits } from '@/common'
import { hopsFilter as studyPlanFilter, creditDateFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { DateFormat } from '@/constants/date'
import { formatDate } from '@/util/timeAndDate'
import { CollapsibleCreditRow } from './CollapsibleCreditRow'

dayjs.extend(isBetween)

export const CreditsGainedTable = ({ filteredStudents, programmeGoalTime, type, year }) => {
  const { useFilterSelector } = useFilters()
  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions())
  const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive())

  if (!filteredStudents || !filteredStudents.length || !type) return null
  let creditList = []

  const getStudentsInCreditCategory = (min, max = Infinity) =>
    max === 0
      ? creditList.filter(student => student.credits === 0).map(student => student.studentNumber)
      : creditList
          .filter(student => student.credits < max && student.credits >= min)
          .map(student => student.studentNumber)

  const getMonths = (start, end) => {
    const lastDayOfMonth = dayjs(end).endOf('month')
    return Math.round(dayjs(lastDayOfMonth).diff(dayjs(start), 'months', true))
  }

  const start = dayjs(`${year}-08-01`)
  const end = formatDate(new Date(), DateFormat.ISO_DATE)

  const { startDate, endDate } = creditDateFilterOptions
  const months = getMonths(startDate ?? start, endDate ?? end)
  const title = `${formatDate(startDate ?? start, DateFormat.DISPLAY_DATE)} and ${formatDate(endDate ?? end, DateFormat.DISPLAY_DATE)}`

  if (studyPlanFilterIsActive) {
    creditList = filteredStudents.map(({ studentNumber, hopsCredits: credits }) => ({ studentNumber, credits }))
  } else {
    creditList = filteredStudents.map(({ studentNumber, courses }) => ({
      studentNumber,
      credits: getStudentTotalCredits({
        courses: courses.filter(course => dayjs(course.date).isBetween(startDate ?? start, endDate ?? end)),
      }),
    }))
  }

  const monthsForLimits = programmeGoalTime ? Math.min(months, programmeGoalTime) : months

  const limits = [
    [Math.ceil(monthsForLimits * (60 / 12))],
    [Math.ceil(monthsForLimits * (45 / 12)), Math.ceil(monthsForLimits * (60 / 12))],
    [Math.ceil(monthsForLimits * (30 / 12)), Math.ceil(monthsForLimits * (45 / 12))],
    [Math.ceil(monthsForLimits * (15 / 12)), Math.ceil(monthsForLimits * (30 / 12))],
    [1, Math.ceil(monthsForLimits * (15 / 12))],
    [null, 0],
  ]

  return (
    <div className="credits-gained-table" data-cy={`credits-gained-table-${type}`}>
      <h3>{type}</h3>
      <Table celled>
        <Table.Header>
          <Table.Row key={`credits-gained-table-${type}`}>
            <Table.HeaderCell collapsing />
            <Table.HeaderCell key={`${title}-${type}`}>
              {studyPlanFilterIsActive ? (
                'All credits in studyplan'
              ) : (
                <div style={{ whiteSpace: 'break-spaces' }}>
                  Credits gained between {title} ({months} {months === 1 ? 'month' : 'months'})
                </div>
              )}
            </Table.HeaderCell>
            <Table.HeaderCell key={`credits-number-of-students-${type}`}>
              Number of students
              <br />
              <span style={{ fontWeight: 100 }}>(n = {filteredStudents.length})</span>
            </Table.HeaderCell>
            <Table.HeaderCell key={`credits-percentage-of-students-${type}`}>Percentage of population</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body data-cy="credits-gained-table-body">
          {limits.map(([min, max]) => (
            <CollapsibleCreditRow
              filteredLength={filteredStudents.length}
              getStudentsInCreditCategory={getStudentsInCreditCategory}
              key={`credits-table-row-${min}-${max}-${type}`}
              max={max}
              min={min}
              months={monthsForLimits}
              monthsFromStart={months}
              studyPlanFilterIsActive={studyPlanFilterIsActive}
            />
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}
