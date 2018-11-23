import React, { Fragment } from 'react'
import { Table } from 'semantic-ui-react'

const getCount = count => (count === undefined ? 0 : count)
const getYearCount = (year, passingSemesters) => getCount(passingSemesters[`${year}-FALL`]) + getCount(passingSemesters[`${year}-SPRING`])

const renderYear = (year, passingSemesters) => (
  <Fragment>
    <Table.Cell>{passingSemesters[`${year}-FALL`]}</Table.Cell>
    <Table.Cell>{passingSemesters[`${year}-SPRING`]}</Table.Cell>
  </Fragment>
)

const renderCompactYear = (year, passingSemesters) => (
  <Fragment>
    <Table.Cell>{getYearCount(year, passingSemesters) || ''}</Table.Cell>
  </Fragment>
)

const CourseRow = ({ statistics }) => { // eslint-disable-line react/prop-types
  const { passingSemesters } = statistics.stats

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

      <Table.Cell>{passingSemesters.BEFORE}</Table.Cell>
      {renderYear(0, passingSemesters)}
      {renderYear(1, passingSemesters)}
      {renderYear(2, passingSemesters)}
      {renderYear(3, passingSemesters)}
      {renderCompactYear(4, passingSemesters)}
      {renderCompactYear(5, passingSemesters)}
      <Table.Cell>{passingSemesters.LATER}</Table.Cell>
    </Table.Row>
  )
}

export default ({ courses }) => ( // eslint-disable-line react/prop-types
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
