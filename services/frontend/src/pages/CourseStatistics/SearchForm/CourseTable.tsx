import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DeleteIcon } from '@/theme'
import { getActiveYears } from '../util'

export const CourseTable = ({
  combineSubstitutions,
  courses,
  hidden,
  onSelectCourse,
  title,
}: {
  combineSubstitutions: boolean
  courses: any[]
  hidden: boolean
  onSelectCourse: (course: any) => void
  title: string
}) => {
  const { getTextIn } = useLanguage()
  const noContent = courses.length === 0

  const getEmptyListRow = () => (
    <TableRow>
      <TableCell align="center" colSpan={2}>
        No results.
      </TableCell>
    </TableRow>
  )

  const toCourseRow = course => (
    <TableRow
      data-cy={`course-${course.code}`}
      hover
      key={course.id}
      onClick={() => (course.min_attainment_date ? onSelectCourse(course) : null)}
      style={{ cursor: course.min_attainment_date ? 'pointer' : 'default' }}
    >
      <TableCell>
        <Typography variant="subtitle1">{getTextIn(course.name)}</Typography>
        <Typography color="text.secondary" variant="body2">
          {getActiveYears(course)}
        </Typography>
      </TableCell>
      <TableCell>{combineSubstitutions ? [course.code, ...course.substitutions].join(', ') : course.code}</TableCell>
      {title === 'Selected courses' && (
        <TableCell align="right">
          <IconButton>
            <DeleteIcon />
          </IconButton>
        </TableCell>
      )}
    </TableRow>
  )

  if (hidden) {
    return null
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{title}</TableCell>
            <TableCell>Code(s)</TableCell>
            {title === 'Selected courses' && <TableCell />}
          </TableRow>
        </TableHead>
        <TableBody>{noContent ? getEmptyListRow() : courses.map(toCourseRow)}</TableBody>
      </Table>
    </TableContainer>
  )
}
