import Chip from '@mui/material/Chip'

import { GroupChip } from '@/components/common/EquivalenceGroupChip'
import { StarIcon } from '@/theme'

export const PrimaryCourseLabel = ({ code, name }: { code: string; name: string }) => (
  <Chip color={'primary'} icon={<StarIcon fontSize="small" />} label={`${code} • ${name}`} />
)

export const SecondaryCourseLabel = ({ code, name }: { code: string; name: string }) => (
  <GroupChip group={[`${code} • ${name}`]} />
)
