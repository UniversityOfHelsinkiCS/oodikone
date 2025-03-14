import { Chip } from '@mui/material'

import { CourseVisibility } from '@/types/courseVisibility'

export const VisibilityChip = ({ visibility }: { visibility: CourseVisibility }) => {
  return (
    <Chip
      label={visibility}
      size="small"
      sx={{
        color: theme => theme.palette.courseVisibility[visibility],
        borderColor: theme => theme.palette.courseVisibility[visibility],
      }}
      variant="outlined"
    />
  )
}
