import moment from 'moment/moment'
import { Table } from 'semantic-ui-react'

import { hopsFilter as studyPlanFilter, creditDateFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { DISPLAY_DATE_FORMAT, ISO_DATE_FORMAT } from '@/constants/date'
import { CollapsibleCreditRow } from './CollapsibleCreditRow'

export const CreditsGainedTable = ({ filteredStudents, programmeGoalTime, type, year }) => {
  const { useFilterSelector } = useFilters()
  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions)
  const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive)

  if (!filteredStudents || !filteredStudents.length || !type) return null
  let creditList = []

  const getStudentsInCreditCategory = (min, max = Infinity) =>
    max === 0
      ? creditList.filter(student => student.credits === 0).map(student => student.studentNumber)
      : creditList
          .filter(student => student.credits < max && student.credits >= min)
          .map(student => student.studentNumber)

  const getMonths = (start, end) => {
    const lastDayOfMonth = moment(end).endOf('month')
    return Math.round(moment.duration(moment(lastDayOfMonth).diff(moment(start))).asMonths())
  }

  const start = moment(`${year}-08-01`)
  const end = moment().format(ISO_DATE_FORMAT)

  const { startDate, endDate } = creditDateFilterOptions
  const months = getMonths(startDate ?? start, endDate ?? end)
  const title = `${moment(startDate ?? start).format(DISPLAY_DATE_FORMAT)} and ${moment(endDate ?? end).format(DISPLAY_DATE_FORMAT)}`

  if (startDate == null && endDate == null && !studyPlanFilterIsActive) {
    creditList = filteredStudents.map(({ studentNumber, credits }) => ({ studentNumber, credits }))
  } else if (studyPlanFilterIsActive) {
    creditList = filteredStudents.map(({ studentNumber, hopsCredits: credits }) => ({ studentNumber, credits }))
  } else {
    creditList = filteredStudents.map(({ studentNumber, courses }) => ({
      studentNumber,
      credits: courses.reduce(
        (results, course) => results + (course.passed && !course.isStudyModuleCredit ? course.credits : 0),
        0
      ),
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
