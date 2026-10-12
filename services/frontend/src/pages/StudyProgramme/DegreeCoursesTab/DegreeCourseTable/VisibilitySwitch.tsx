import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'

import { CourseVisibility } from '@/types/courseVisibility'

const labels: Record<CourseVisibility, string> = {
  [CourseVisibility.NO_COURSES]: 'No courses',
  [CourseVisibility.HIDDEN]: 'Hidden',
  [CourseVisibility.PARTIAL]: 'Partly shown',
  [CourseVisibility.VISIBLE]: 'Shown',
}

const colors = {
  [CourseVisibility.NO_COURSES]: 'noCourses',
  [CourseVisibility.HIDDEN]: 'hidden',
  [CourseVisibility.PARTIAL]: 'partial',
  [CourseVisibility.VISIBLE]: 'visible',
} as const

export const VisibilitySwitch = ({
  ariaLabel,
  cypress,
  onChange,
  visibility,
}: {
  ariaLabel: string
  cypress: string
  onChange: () => void
  visibility: CourseVisibility
}) => (
  <FormControlLabel
    control={
      <Switch
        checked={visibility === CourseVisibility.VISIBLE || visibility === CourseVisibility.PARTIAL}
        disabled={visibility === CourseVisibility.NO_COURSES}
        onChange={onChange}
        size="small"
        inputProps={{ 'aria-label': ariaLabel }}
      />
    }
    data-cy={cypress}
    label={labels[visibility]}
    onClick={event => event.stopPropagation()}
    slotProps={{
      typography: {
        variant: 'body2',
        sx: { color: theme => theme.palette.courseVisibility[colors[visibility]], whiteSpace: 'nowrap' },
      },
    }}
    sx={{ mr: 0 }}
  />
)
