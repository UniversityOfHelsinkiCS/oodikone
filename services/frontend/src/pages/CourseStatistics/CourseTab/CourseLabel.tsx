import StarIcon from '@mui/icons-material/Star'
import SwapIcon from '@mui/icons-material/SwapHoriz'
import Chip from '@mui/material/Chip'

export const PrimaryCourseLabel = ({ code, name }: { code: string; name: string }) => (
  <Chip color={'primary'} icon={<StarIcon fontSize="small" />} label={`${code} • ${name}`} />
)

export const SecondaryCourseLabel = ({ code, name }: { code: string; name: string }) => (
  <Chip icon={<SwapIcon fontSize="small" />} label={`${code} • ${name}`} />
)
