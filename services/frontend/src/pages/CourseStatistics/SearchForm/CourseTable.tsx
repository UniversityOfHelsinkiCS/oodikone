import { DeleteOutline as DeleteOutlineIcon } from '@mui/icons-material'
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { sortBy } from 'lodash'
import { memo } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { getActiveYears } from '../courseStatisticsUtils'

const CourseTable = ({
  courses,
  hidden,
  onSelectCourse,
  title,
}: {
  courses: any[]
  hidden: boolean
  onSelectCourse: (course: any) => void
  title: string
}) => {
  const { getTextIn } = useLanguage()
  const noContent = courses.length === 0
  const sortCourses = courses => sortBy(courses, course => getTextIn(course.name))

  const getEmptyListRow = () => (
    <TableRow>
      <TableCell align="center" colSpan={2}>
        No results.
      </TableCell>
    </TableRow>
  )

  const toCourseRow = course => (
    <TableRow
      hover
      key={course.id}
      onClick={() => (course.min_attainment_date ? onSelectCourse(course) : null)}
      style={{ cursor: course.min_attainment_date ? 'pointer' : 'default' }}
    >
      <TableCell>
        <Typography variant="subtitle1">{getTextIn(course.name)}</Typography>
        <Typography color="textSecondary" variant="body2">
          {getActiveYears(course)}
        </Typography>
      </TableCell>
      <TableCell>{[course.code, ...course.substitutions].join(', ')}</TableCell>
      {title === 'Selected courses' && (
        <TableCell align="right">
          <IconButton>
            <DeleteOutlineIcon />
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
        <TableBody>{noContent ? getEmptyListRow() : sortCourses(courses).map(toCourseRow)}</TableBody>
      </Table>
    </TableContainer>
  )
}

const areEqual = (prevProps, nextProps) => {
  if (prevProps.courses.length !== nextProps.courses.length) {
    return false
  }
  return prevProps.courses.every(c1 => nextProps.courses.some(c2 => c1.code === c2.code))
}

export const MemoizedCourseTable = memo(CourseTable, areEqual)
