import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { intersection, orderBy } from 'lodash'

import { getHighestGradeOfCourseBetweenRange } from '@/common'
import { PercentageBar } from '@/components/material/PercentageBar'
import { StyledTable } from '@/components/material/StyledTable'
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
    <StyledTable showCellBorders>
      <TableHead>
        <TableRow>
          <TableCell width={1} /* width: 1, forces the cell to collapse */ />
          <TableCell>Grades</TableCell>
          <TableCell>
            Number of students
            <div style={{ fontWeight: 100 }}>(n={students.length})</div>
          </TableCell>
          <TableCell>Percentage of population</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {sortedCourseGrades.map(grade => (
          <TableRow key={`grade-table-row-${grade.grade}`}>
            <TableCell collapsing>
              <ExternalGradeFilterToggle grade={grade.grade} />
            </TableCell>
            <TableCell>{grade.grade}</TableCell>
            <TableCell>{grade.amount}</TableCell>
            <TableCell>
              <PercentageBar denominator={students.length} numerator={grade.amount} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </StyledTable>
  )
}
