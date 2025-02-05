import { Loop as LoopIcon, Star as StarIcon } from '@mui/icons-material'
import { Chip } from '@mui/material'

export const CourseLabel = ({ code, name, primary }: { code: string; name: string; primary?: boolean }) => {
  return (
    <Chip
      color={primary ? 'primary' : undefined}
      icon={primary ? <StarIcon fontSize="small" /> : <LoopIcon fontSize="small" />}
      label={`${code} • ${name}`}
    />
  )
}
