import React from 'react'
import _ from 'lodash'
import { Segment, Table, Button } from 'semantic-ui-react'
import { func, arrayOf, shape, string, bool } from 'prop-types'

import styles from './courseTable.css'

const CourseTable = ({ courses, onSelectCourse, hidden, title, emptyListText, controlIcon }) => {
  const noContent = courses.length === 0
  const sortedCourses = !noContent && _.sortBy(courses, course => course.name)

  const getEmptyListRow = () => (
    <Table.Row>
      <Table.Cell colSpan="3" content={emptyListText} />
    </Table.Row>
  )

  const getCourseRow = course => (
    <Table.Row key={course.code}>
      <Table.Cell content={course.name} width={10} />
      <Table.Cell content={course.code} />
      <Table.Cell>
        <Button
          basic
          className={styles.controlIcon}
          icon={controlIcon}
          onClick={() => onSelectCourse(course)}
        />
      </Table.Cell>
    </Table.Row>
  )

  return (
    !hidden && (
    <Segment basic style={{ padding: '0' }} >
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell content={title} />
            <Table.HeaderCell content="Code" />
            <Table.HeaderCell content="Select" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {
            noContent
              ? getEmptyListRow()
              : sortedCourses.map(getCourseRow)
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
