import Box from '@mui/material/Box'
import TableBody from '@mui/material/TableBody'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { intersection, orderBy } from 'lodash'

import { getHighestGradeOfCourseBetweenRange } from '@/common'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PercentageBar } from '@/components/common/PercentageBar'
import { StyledCell } from '@/components/common/StyledCell'
import { StyledTable } from '@/components/common/StyledTable'
import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { FormattedStudent } from '@oodikone/shared/types'
import { ExternalGradeFilterToggle } from './ExternalGradeFilterToggle'

export const CoursePopulationGradeDist = ({
  students,
  courseCodes,
  from,
  to,
}: {
  students: FormattedStudent[]
  courseCodes: string[]
  from: string
  to: string
}) => {
  const courseGrades: { grade: string; amount: number }[] = []

  if (students) {
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
          <StyledCell width={1} /* width: 1, forces the cell to collapse */ />
          <StyledCell>
            <Box sx={{ display: 'flex' }}>
              <Typography fontWeight="bold" mr={1}>
                Grades
              </Typography>
              <InfoBox content={populationStatisticsToolTips.gradeDistributionCoursePopulation} mini />
            </Box>
          </StyledCell>
          <StyledCell>
            <Typography fontWeight="bold">Number of students</Typography>
            <Typography>(n={students.length})</Typography>
          </StyledCell>
          <StyledCell bold>Percentage of population</StyledCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {sortedCourseGrades.map(grade => (
          <TableRow key={`grade-table-row-${grade.grade}`}>
            <StyledCell>
              <ExternalGradeFilterToggle grade={grade.grade} />
            </StyledCell>
            <StyledCell text>{grade.grade}</StyledCell>
            <StyledCell text>{grade.amount}</StyledCell>
            <StyledCell>
              <PercentageBar denominator={students.length} numerator={grade.amount} />
            </StyledCell>
          </TableRow>
        ))}
      </TableBody>
    </StyledTable>
  )
}
