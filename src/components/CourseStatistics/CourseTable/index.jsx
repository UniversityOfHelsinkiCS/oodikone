import React from 'react'
import _ from 'lodash'
import { Segment, Table, Button } from 'semantic-ui-react'
import { func, arrayOf, shape, string, bool } from 'prop-types'
import moment from 'moment'

import styles from './courseTable.css'

const MIN_YEAR = 1899
const MAX_YEAR = 2112

const CourseTable = ({ courses, onSelectCourse, hidden, title, emptyListText, controlIcon }) => {
  const noContent = courses.length === 0
  const sortedCourses = !noContent && _.sortBy(courses, course => course.name)

  const getEmptyListRow = () => (
    <Table.Row>
      <Table.Cell colSpan="3" content={emptyListText} />
    </Table.Row>
  )

  const isSpring = date => moment(date).month() < 7
  const isPre2016Course = course => !Number.isNaN(Number(course.code.charAt(0)))
  const twoDigitYear = year => year.toString().substring(2, 4)
  const getSemesterText = (start, end) => `${start}-${twoDigitYear(end)}`
  const getYearText = (year, spring) => (spring ? getSemesterText(year - 1, year) : getSemesterText(year, year + 1))

  const getActiveYears = (course) => {
    const startYear = moment(course.startdate).year()
    const endYear = moment(course.enddate).year()

    const startYearText = getYearText(startYear, isSpring(course.startdate))
    const endYearText = getYearText(endYear, isSpring(course.enddate))

    if (endYear === MAX_YEAR && isPre2016Course(course)) {
      return `— ${getYearText(2016, false)}`
    }

    if (startYear === MIN_YEAR) {
      return `— ${endYearText}`
    }

    if (endYear === MAX_YEAR) {
      return `${startYearText} — `
    }

    return `${startYearText} — ${endYearText}`
  }

  const getCourseRow = course => (
    <Table.Row key={course.code}>
      <Table.Cell width={10}>
        <div>{course.name}</div>
        <div>{getActiveYears(course)}</div>
      </Table.Cell>
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
