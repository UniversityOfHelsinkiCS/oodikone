import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import dayjs, { extend as dayjsExtend } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

import { languageAbbreviations } from '@/common'
import { PercentageBar } from '@/components/common/PercentageBar'
import { StyledTable } from '@/components/common/StyledTable'
import { FormattedStudent } from '@oodikone/shared/types'

dayjsExtend(isBetween)

export const CoursePopulationLanguageDist = ({
  students,
  codes,
  from,
  to,
}: {
  students: FormattedStudent[]
  codes: string[]
  from: Date
  to: Date
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
          <TableCell>
            <Typography fontWeight="bold">Languages</Typography>
          </TableCell>
          <TableCell>
            <Typography fontWeight="bold">Language distribution</Typography>
            <Typography fontWeight="light">(n = {total})</Typography>
          </TableCell>
          <TableCell>
            <Typography fontWeight="bold">Percentage of population</Typography>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(languages).map(([language, count]) => (
          <TableRow key={`language-table-row-${language}`}>
            <TableCell>
              <Typography>{languageAbbreviations[language] ?? language}</Typography>
            </TableCell>
            <TableCell>
              <Typography>{count}</Typography>
            </TableCell>
            <TableCell>
              <PercentageBar denominator={total} numerator={count} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </StyledTable>
  )
}
