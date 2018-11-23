import React, { Fragment } from 'react'
import { Table } from 'semantic-ui-react'

const CourseRow = ({ statistics }) => {
  const renderYear = year => (
    <Fragment>
      <Table.Cell>{statistics.stats.dates[`${year}-FALL`]}</Table.Cell>
      <Table.Cell>{statistics.stats.dates[`${year}-SPRING`]}</Table.Cell>
    </Fragment>
  )

  const getCount = count => (count === undefined ? 0 : count)
  const getYearCount = year => getCount(statistics.stats.dates[`${year}-FALL`]) + getCount(statistics.stats.dates[`${year}-SPRING`])

  const renderCompactYear = year => (
    <Fragment>
      <Table.Cell>
        {getYearCount(year) || ''}
      </Table.Cell>
    </Fragment>
  )

  return (
    <Table.Row key={statistics.course.code}>
      <Table.Cell>
        {statistics.course.code}
      </Table.Cell>
      <Table.Cell>
        {statistics.course.name.fi}
      </Table.Cell>
      <Table.Cell>
        {statistics.stats.students}
      </Table.Cell>
      <Table.Cell>
        {statistics.stats.passed}
      </Table.Cell>

      <Table.Cell>{statistics.stats.dates.BEFORE}</Table.Cell>
      {renderYear(0)}
      {renderYear(1)}
      {renderYear(2)}
      {renderYear(3)}
      {renderCompactYear(4)}
      {renderCompactYear(5)}
      <Table.Cell>{statistics.stats.dates.LATER}</Table.Cell>
    </Table.Row>
  )
}

export default ({ courses }) => {
  console.log(courses)

  return (
    <div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Course code</Table.HeaderCell>
            <Table.HeaderCell>Course name</Table.HeaderCell>
            <Table.HeaderCell>Students</Table.HeaderCell>
            <Table.HeaderCell>Passed</Table.HeaderCell>

            <Table.HeaderCell>Before 1st year</Table.HeaderCell>
            <Table.HeaderCell>1st fall</Table.HeaderCell>
            <Table.HeaderCell>1st spring</Table.HeaderCell>
            <Table.HeaderCell>2nd fall</Table.HeaderCell>
            <Table.HeaderCell>2nd spring</Table.HeaderCell>
            <Table.HeaderCell>3rd fall</Table.HeaderCell>
            <Table.HeaderCell>3rd spring</Table.HeaderCell>
            <Table.HeaderCell>4th fall</Table.HeaderCell>
            <Table.HeaderCell>4th spring</Table.HeaderCell>
            <Table.HeaderCell>5th year</Table.HeaderCell>
            <Table.HeaderCell>6th year</Table.HeaderCell>
            <Table.HeaderCell>Later</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {courses.coursestatistics.map(stats => (
            <CourseRow key={stats.course.code} statistics={stats} />
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}
