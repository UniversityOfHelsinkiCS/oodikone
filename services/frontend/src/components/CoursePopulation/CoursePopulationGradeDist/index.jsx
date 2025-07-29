import { intersection, orderBy } from 'lodash'
import { Progress, Table } from 'semantic-ui-react'

import { getHighestGradeOfCourseBetweenRange } from '@/common'
import { ExternalGradeFilterToggle } from './ExternalGradeFilterToggle'

export const CoursePopulationGradeDist = ({ singleCourseStats, students, courseCodes, from, to }) => {
  const courseGrades = []

  if (students && singleCourseStats?.unifyStats?.alternatives) {
    const grades = {}

    students.forEach(student => {
      const courses = student.courses.filter(course => courseCodes.includes(course.course_code))
      const highestGrade = getHighestGradeOfCourseBetweenRange(courses, from, to)
      if (!highestGrade) {
        grades['No grade'] ??= []
        grades['No grade'].push(student.studentNumber)
      } else {
        grades[highestGrade] ??= []
        grades[highestGrade].push(student.studentNumber)
      }
    })

    Object.keys(grades).forEach(grade => {
      const filteredGrades = intersection(
        students.map(student => student.studentNumber),
        grades[grade]
      )
      courseGrades.push({ grade, amount: filteredGrades.length })
    })
  }

  const sortedCourseGrades = orderBy(
    courseGrades,
    courseGrade => (Number(courseGrade.grade) ? `_${courseGrade.grade}` : courseGrade.grade),
    ['desc']
  )

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell collapsing />
          <Table.HeaderCell>Grades</Table.HeaderCell>
          <Table.HeaderCell>
            Number of students
            <div style={{ fontWeight: 100 }}>(n={students.length})</div>
          </Table.HeaderCell>
          <Table.HeaderCell>Percentage of population</Table.HeaderCell>
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
                precision={0}
                progress="percent"
                style={{ margin: 0 }}
                total={students.length}
                value={grade.amount}
              />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}
