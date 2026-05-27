import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { GroupChip } from '@/components/common/EquivalenceGroupChip'
import { StyledTable } from '@/components/common/StyledTable'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DeleteIcon } from '@/theme'
import { SearchResultCourse } from '@/types/api/courses'
import { getActiveYears } from '../util'

const EmptyListRow = () => (
  <TableRow>
    <TableCell align="center" colSpan={3}>
      No results.
    </TableCell>
  </TableRow>
)

const CourseRow = ({
  course,
  title,
  onSelectCourse,
  combineSubstitutions,
}: {
  course: SearchResultCourse
  title: string
  onSelectCourse: (course: SearchResultCourse) => void
  combineSubstitutions: boolean
}) => {
  const { getTextIn } = useLanguage()

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
        <Typography fontSize="0.9rem">{course.code}</Typography>
      </TableCell>
      <TableCell>
        {combineSubstitutions ? (
          <Stack>
            {course?.substitution_groups.map(group => (
              <GroupChip getTextIn={getTextIn} group={group} key={group.map(({ code }) => code).join(':')} />
            )) ?? <Typography fontSize="0.9rem">Equivalent groups not available!</Typography>}
          </Stack>
        ) : (
          course.code
        )}
      </TableCell>
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

export const CourseTable = ({
  combineSubstitutions,
  courses,
  hidden,
  onSelectCourse,
  title,
}: {
  combineSubstitutions: boolean
  courses: SearchResultCourse[]
  hidden: boolean
  onSelectCourse: (course: SearchResultCourse) => void
  title: string
}) => {
  // TODO: Figure a better type for this

  const noContent = courses.length === 0

  if (hidden) {
    return null
  }

  return (
    <StyledTable>
      <TableHead>
        <TableRow>
          <TableCell>{title}</TableCell>
          <TableCell>Main course code</TableCell>
          <TableCell>Equivalent groups</TableCell>
          {title === 'Selected courses' && <TableCell />}
        </TableRow>
      </TableHead>
      <TableBody>
        {noContent ? (
          <EmptyListRow />
        ) : (
          courses?.map(course => (
            <CourseRow
              combineSubstitutions={combineSubstitutions}
              course={course}
              key={course.code}
              onSelectCourse={onSelectCourse}
              title={title}
            />
          ))
        )}
      </TableBody>
    </StyledTable>
  )
}
