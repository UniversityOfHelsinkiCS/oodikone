import Chip from '@mui/material/Chip'

import { GroupChip } from '@/components/common/EquivalenceGroupChip'
import { StarIcon } from '@/theme'

export const PrimaryCourseLabel = ({ code, name }: { code: string; name: string }) => (
  <Chip color={'primary'} icon={<StarIcon fontSize="small" />} label={`${code} • ${name}`} />
)

export const SecondaryCourseLabel = ({ group }: { group: string[] }) => (
  <GroupChip group={group.map(code => code)} separator={' • '} />
)
