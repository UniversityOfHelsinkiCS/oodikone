import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DeleteIcon } from '@/theme'
import { SearchResultCourse } from '@/types/api/courses'
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
      <TableCell align="center" colSpan={3}>
        No results.
      </TableCell>
    </TableRow>
  )

  const formatSubstitutionGroups = (course: SearchResultCourse): string[] =>
    course.substitution_groups?.map(sb => (sb.length !== 1 ? `${sb.join(', ')}` : sb[0])) ?? ['???']

  const SubstitutionGroups = (course: SearchResultCourse) => (
    <Stack>
      {formatSubstitutionGroups(course).map(sg => (
        <Typography fontSize="0.9rem" key={sg}>
          {sg}
        </Typography>
      ))}
    </Stack>
  )

  const toCourseRow = (course: SearchResultCourse) => {
    return (
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
        <TableCell>
          <Typography fontSize="0.95rem">{course.code}</Typography>
        </TableCell>
        <TableCell>{combineSubstitutions ? SubstitutionGroups(course) : course.code}</TableCell>
        {title === 'Selected courses' && (
          <TableCell align="right">
            <IconButton>
              <DeleteIcon />
            </IconButton>
          </TableCell>
        )}
      </TableRow>
    )
  }

  if (hidden) {
    return null
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{title}</TableCell>
            <TableCell>Main course code</TableCell>
            <TableCell>Equivalent groups</TableCell>
            {title === 'Selected courses' && <TableCell />}
          </TableRow>
        </TableHead>
        <TableBody>{noContent ? getEmptyListRow() : courses.map(toCourseRow)}</TableBody>
      </Table>
    </TableContainer>
  )
}
