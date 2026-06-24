import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { GetTextIn } from '@/components/LanguagePicker/useLanguage'
import { SwapHorizIcon } from '@/theme'
import { Name } from '@oodikone/shared/types'

export const GroupChip = ({
  group,
  getTextIn,
  separator = ' • ',
}: {
  group: { code: string; name: Name }[]
  getTextIn: GetTextIn
  separator?: string
}) => {
  if (!group) return null
  return (
    <Chip
      icon={<SwapHorizIcon color="primary" fontSize="small" />}
      label={<CourseCodes courses={group} getTextIn={getTextIn} separator={separator} />}
      sx={{ my: 0.25, width: 'fit-content' }}
    />
  )
}

const CourseCodes = ({
  courses,
  getTextIn,
  separator,
}: {
  courses: { code: string; name: Name }[]
  getTextIn: GetTextIn
  separator: string
}) => (
  <Stack direction="row" divider={<span>{separator}</span>} spacing={0.5}>
    {courses.map(course => (
      <CourseCode code={course.code} getTextIn={getTextIn} key={course.code} name={course.name} />
    ))}
  </Stack>
)

const CourseCode = ({ code, name, getTextIn }: { code: string; name: Name; getTextIn: GetTextIn }) => (
  <Tooltip title={getTextIn(name)}>
    <Typography fontSize="small">{code}</Typography>
  </Tooltip>
)
