import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import dayjs, { extend as dayjsExtend } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

import { languageAbbreviations } from '@/common'
import { PercentageBar } from '@/components/common/PercentageBar'
import { StyledTable } from '@/components/common/StyledTable'

dayjsExtend(isBetween)

export const CoursePopulationLanguageDist = ({ samples, codes, from, to }) => {
  const languages = {}

  samples?.forEach(student => {
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
          <TableCell>Languages</TableCell>
          <TableCell>
            Language distribution
            <div style={{ fontWeight: 'lighter' }}>(n = {total})</div>
          </TableCell>
          <TableCell>Percentage of population</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(languages).map(([language, count]) => (
          <TableRow key={`language-table-row-${language}`}>
            <TableCell>{languageAbbreviations[language] ?? language}</TableCell>
            <TableCell>{count}</TableCell>
            <TableCell>
              <PercentageBar denominator={total} numerator={count} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </StyledTable>
  )
}
