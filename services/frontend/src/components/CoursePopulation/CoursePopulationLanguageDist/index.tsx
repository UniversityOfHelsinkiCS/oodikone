import TableBody from '@mui/material/TableBody'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import dayjs, { extend as dayjsExtend } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

import { languageAbbreviations } from '@/common'
import { PercentageBar } from '@/components/common/PercentageBar'
import { StyledCell } from '@/components/common/StyledCell'
import { StyledTable } from '@/components/common/StyledTable'
import type { FormattedStudent } from '@oodikone/shared/types'

dayjsExtend(isBetween)

export const CoursePopulationLanguageDist = ({
  students,
  codes,
  from,
  to,
}: {
  students: FormattedStudent[]
  codes: string[]
  from: string
  to: string
}) => {
  const languages: Record<string, number> = {}

  students.forEach(student => {
    const filteredCourse = student.courses
      .filter(course => codes.includes(course.course_code))
      .filter(course => dayjs(course.date).isBetween(dayjs(from), dayjs(to)))
      .sort((a, b) => Number(new Date(b.date) < new Date(a.date)))
      .find(({ language }) => !!language)

    if (filteredCourse) {
      languages[filteredCourse.language] ??= 0
      languages[filteredCourse.language] += 1
    }
  })

  const total = Object.values(languages).reduce((acc, cur) => acc + cur, 0)
  if (total === 0) return <p>No data available!</p>

  return (
    <StyledTable showCellBorders>
      <TableHead>
        <TableRow>
          <StyledCell bold>Languages</StyledCell>
          <StyledCell>
            <Typography fontWeight="bold">Language distribution</Typography>
            <Typography fontWeight="light">(n = {total})</Typography>
          </StyledCell>
          <StyledCell bold>Percentage of population</StyledCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(languages).map(([language, count]) => (
          <TableRow key={`language-table-row-${language}`}>
            <StyledCell text>{languageAbbreviations[language] ?? language}</StyledCell>
            <StyledCell text>{count}</StyledCell>
            <StyledCell>
              <PercentageBar denominator={total} numerator={count} />
            </StyledCell>
          </TableRow>
        ))}
      </TableBody>
    </StyledTable>
  )
}
