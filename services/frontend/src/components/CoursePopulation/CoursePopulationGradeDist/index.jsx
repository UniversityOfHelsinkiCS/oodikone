import React from 'react'
import { Progress, Table } from 'semantic-ui-react'
import { intersection, orderBy } from 'lodash'
import moment from 'moment'

import { getHighestGradeOfCourseBetweenRange } from '../../../common'
import { ExternalGradeFilterToggle } from './ExternalGradeFilterToggle'

export const CoursePopulationGradeDist = ({ singleCourseStats, students, courseCodes, from, to }) => {
  const courseGrades = []

  if (students && singleCourseStats?.unifyStats?.alternatives) {
    const grades = {}

    students.forEach(student => {
      const courses = student.courses.filter(c => courseCodes.includes(c.course_code))
      const hasEnrollment =
        student.enrollments?.some(
          e => courseCodes.includes(e.course_code) && moment(e.enrollment_date_time).isBetween(moment(from), moment(to))
        ) ?? false
      const highestGrade = getHighestGradeOfCourseBetweenRange(courses, from, to)
      if (!highestGrade && hasEnrollment) {
        if (!grades['No grade']) grades['No grade'] = []
        grades['No grade'].push(student.studentNumber)
      }

      if (highestGrade) {
        if (!grades[highestGrade.grade]) {
          grades[highestGrade.grade] = []
        }
        grades[highestGrade.grade].push(student.studentNumber)
      }
    })

    Object.keys(grades).forEach(grade => {
      const filteredGrades = intersection(
        students.map(s => s.studentNumber),
        grades[grade]
      )
      courseGrades.push({ grade, amount: filteredGrades.length })
    })
  }

  const sortedCourseGrades = orderBy(courseGrades, e => (Number(e.grade) ? `_${e.grade}` : e.grade), ['desc'])

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell collapsing />
          <Table.HeaderCell>Grades</Table.HeaderCell>
          <Table.HeaderCell>
            Number of Students
            <div style={{ fontWeight: 100 }}>(n={students.length})</div>
          </Table.HeaderCell>
          <Table.HeaderCell>Percentage of Population</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {sortedCourseGrades.map(grade => (
          <Table.Row key={`grade-table-row-${grade.grade}`}>
            <Table.Cell collapsing>
              <ExternalGradeFilterToggle grade={grade.grade} />
            </Table.Cell>
            <Table.Cell>{grade.grade}</Table.Cell>
            <Table.Cell>{grade.amount}</Table.Cell>
            <Table.Cell>
              <Progress
                value={grade.amount}
                total={students.length}
                progress="percent"
                precision={0}
                style={{ margin: 0 }}
              />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}
