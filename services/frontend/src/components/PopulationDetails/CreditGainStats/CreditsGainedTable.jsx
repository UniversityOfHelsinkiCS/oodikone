import moment from 'moment/moment'
import React from 'react'
import { Table } from 'semantic-ui-react'
import CollapsibleCreditRow from './CollapsibleCreditRow'

const CreditsGainedTable = ({ filteredStudents, type, year, creditDateFilterOptions }) => {
  if (!filteredStudents || !filteredStudents.length || !type) return null
  let creditList = []
  const studentCount = (min, max = Infinity) =>
    max === 0
      ? creditList.filter(credits => credits === 0).length
      : creditList.filter(credits => credits < max && credits >= min).length

  const getMonths = (start, end) => {
    const lastDayOfMonth = moment(end).endOf('month')
    return Math.round(moment.duration(moment(lastDayOfMonth).diff(moment(start))).asMonths())
  }

  const start = moment(`${year}-08-01`)
  const end = moment().format('YYYY-MM-DD')

  let title = ''
  let months = 0
  const { startDate, endDate } = creditDateFilterOptions || { start, end }
  if (startDate !== null && endDate !== null) {
    months = getMonths(startDate, endDate)
    title = `${moment(startDate).format('DD.MM.YYYY')} and ${moment(endDate).format('DD.MM.YYYY')}`
    creditList = filteredStudents.map(student =>
      student.courses.length > 0
        ? student.courses.reduce(
            (results, course) =>
              results +
              (course.passed &&
                startDate.isSameOrBefore(course.date, 'day') &&
                endDate.isSameOrAfter(course.date, 'day'))
                ? course.credits
                : 0,
            0
          )
        : 0
    )
  } else if (startDate !== null) {
    months = getMonths(startDate, end)
    title = `${moment(startDate).format('DD.MM.YYYY')} and ${moment(end).format('DD.MM.YYYY')}`
    creditList = filteredStudents.map(student =>
      student.courses.length > 0
        ? student.courses.reduce(
            (results, course) =>
              results + (course.passed && startDate.isSameOrBefore(course.date, 'day')) ? course.credits : 0,
            0
          )
        : 0
    )
  } else if (endDate !== null) {
    months = getMonths(start, endDate)
    title = `${moment(start).format('DD.MM.YYYY')} and ${moment(endDate).format('DD.MM.YYYY')}`
    creditList = filteredStudents.map(student =>
      student.courses.lenght > 0
        ? student.courses.reduce(
            (results, course) =>
              results + (course.passed && endDate.isSameOrAfter(course.date, 'day')) ? course.credits : 0,
            0
          )
        : 0
    )
  } else {
    months = getMonths(start, end)
    title = `${moment(start).format('DD.MM.YYYY')} and ${moment(end).format('DD.MM.YYYY')}`
    creditList = filteredStudents.map(student => student.credits)
  }

  const limits = [
    [Math.ceil(months * (60 / 12))],
    [Math.ceil(months * (45 / 12)), Math.ceil(months * (60 / 12))],
    [Math.ceil(months * (30 / 12)), Math.ceil(months * (45 / 12))],
    [Math.ceil(months * (15 / 12)), Math.ceil(months * (30 / 12))],
    [1, Math.ceil(months * (15 / 12))],
    [null, 0],
  ]

  const monthString = months === 1 ? 'Month' : 'Months'
  return (
    <div className="credits-gained-table" data-cy={`credits-gained-table-${type}`}>
      <h3>{type}</h3>
      <Table celled>
        <Table.Header>
          <Table.Row key={`credits-gained-table-${type}`}>
            <Table.HeaderCell collapsing />
            <Table.HeaderCell key={`${title}-${type}`}>
              Gredits Gained Between <br /> {title} <br /> ({months} {monthString})
            </Table.HeaderCell>
            <Table.HeaderCell key={`credits-number-of-students-${type}`}>
              Number of Students
              <br />
              <span style={{ fontWeight: 100 }}>(n={filteredStudents.length})</span>
            </Table.HeaderCell>
            <Table.HeaderCell key={`credits-percentage-of-students-${type}`}>Percentage of Population</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body data-cy="credits-gained-table-body">
          {limits.map(([min, max]) => (
            <CollapsibleCreditRow
              key={`credits-table-row-${min}-${max}-${type}`}
              min={min}
              max={max}
              studentCount={studentCount}
              filteredLength={filteredStudents.length}
              months={Number(months)}
            />
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}

export default CreditsGainedTable
