import moment from 'moment/moment'
import React from 'react'
import { useLocation } from 'react-router-dom'
import { Table } from 'semantic-ui-react'
import { getMonths } from '../../../common/query'
import CollapsibleCreditRow from './CollapsibleCreditRow'

const CreditsGainedTable = ({ filteredStudents, type, year, creditDateFilterOptions }) => {
  const months = getMonths(useLocation())

  if (!filteredStudents || !filteredStudents.length || !type) return null
  let creditList = []
  const studentCount = (min, max = Infinity) =>
    max === 0
      ? creditList.filter(credits => credits === 0).length
      : creditList.filter(credits => credits < max && credits >= min).length

  const start = moment(`${year}-08-01`)
  const end = moment().format('YYYY-MM-DD')

  let title = ''
  const { startDate, endDate } = creditDateFilterOptions || { start, end }
  if (startDate !== null && endDate !== null) {
    title = `Between ${moment(startDate).format('DD.MM.YYYY')} and ${moment(endDate).format('DD.MM.YYYY')}`
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
    title = `Between ${moment(startDate).format('DD.MM.YYYY')} and ${moment(end).format('DD.MM.YYYY')}`
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
    title = `Between ${moment(start).format('DD.MM.YYYY')} and ${moment(endDate).format('DD.MM.YYYY')}`
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
    title = `Between ${moment(start).format('DD.MM.YYYY')} and ${moment(end).format('DD.MM.YYYY')}`
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
  return (
    <div className="credits-gained-table" data-cy={`credits-gained-table-${type}`}>
      <h3>{type}</h3>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell collapsing />
            <Table.HeaderCell>
              {title} <br /> {months} Months from Studyright Start{' '}
            </Table.HeaderCell>
            <Table.HeaderCell>
              Number of Students
              <br />
              <span style={{ fontWeight: 100 }}>(n={filteredStudents.length})</span>
            </Table.HeaderCell>
            <Table.HeaderCell>Percentage of Population</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body data-cy="credits-gained-table-body">
          {limits.map(([min, max]) => (
            <CollapsibleCreditRow
              key={`table-row-${min}-${max}`}
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
