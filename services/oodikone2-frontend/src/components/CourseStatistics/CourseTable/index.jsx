import React from 'react'
import { sortBy } from 'lodash'
import { Segment, Table } from 'semantic-ui-react'
import { func, arrayOf, shape, string, bool } from 'prop-types'
import { getActiveYears } from '../courseStatisticsUtils'

import './courseTable.css'

const CourseTable = ({ courses, onSelectCourse, hidden, title, emptyListText, mandatory = false }) => {
  const noContent = courses.length === 0
  const sortedCourses = !noContent && sortBy(courses, course => course.name)

  const getEmptyListRow = () => (
    <Table.Row>
      <Table.Cell colSpan="3" content={emptyListText} />
    </Table.Row>
  )

  const toCourseRow = (course, i) => (
    // kinda hax solution for the problem, after fetching course course is array of selected course code letters
    <Table.Row style={{ cursor: 'pointer' }} key={`${course.code ? course.code : course[0]}-${i}`} onClick={() => (course.min_attainment_date || mandatory ? onSelectCourse(course) : null)} >
      <Table.Cell key={`${course.code}-${i}`} width={10}>
        <div>{course.name}</div>
        <div>{getActiveYears(course)}</div>
      </Table.Cell>
      <Table.Cell content={course.code} />
    </Table.Row>
  )

  return (
    !hidden && (
      <Segment basic style={{ padding: '0' }} >
        <Table selectable className="fixed-header">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell content={title} />
              <Table.HeaderCell content="Code" />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {
              noContent
                ? getEmptyListRow()
                : sortedCourses.map(toCourseRow)
            }
          </Table.Body>
        </Table>
      </Segment>
    )
  )
}

CourseTable.propTypes = {
  courses: arrayOf(shape({ code: string, name: string, seleted: bool })).isRequired,
  onSelectCourse: func.isRequired,
  hidden: bool.isRequired,
  title: string.isRequired,
  emptyListText: string,
  controlIcon: string.isRequired
}

CourseTable.defaultProps = {
  emptyListText: 'No results.'
}

export default CourseTable
