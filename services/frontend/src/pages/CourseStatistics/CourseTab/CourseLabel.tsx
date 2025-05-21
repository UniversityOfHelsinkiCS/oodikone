import LoopIcon from '@mui/icons-material/Loop'
import StarIcon from '@mui/icons-material/Star'
import Chip from '@mui/material/Chip'

export const CourseLabel = ({ code, name, primary }: { code: string; name: string; primary?: boolean }) => {
  return (
    <Chip
      color={primary ? 'primary' : undefined}
      icon={primary ? <StarIcon fontSize="small" /> : <LoopIcon fontSize="small" />}
      label={`${code} • ${name}`}
    />
  )
}
