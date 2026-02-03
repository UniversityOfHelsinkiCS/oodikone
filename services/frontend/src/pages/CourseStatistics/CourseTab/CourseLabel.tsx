import Chip from '@mui/material/Chip'

import { StarIcon, SwapHorizIcon } from '@/theme'

export const PrimaryCourseLabel = ({ code, name }: { code: string; name: string }) => (
  <Chip color={'primary'} icon={<StarIcon fontSize="small" />} label={`${code} • ${name}`} />
)

export const SecondaryCourseLabel = ({ code, name }: { code: string; name: string }) => (
  <Chip icon={<SwapHorizIcon fontSize="small" />} label={`${code} • ${name}`} />
)
