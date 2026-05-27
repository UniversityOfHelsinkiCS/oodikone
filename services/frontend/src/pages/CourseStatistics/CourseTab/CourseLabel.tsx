import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { GroupChip } from '@/components/common/EquivalenceGroupChip'
import { GetTextIn } from '@/components/LanguagePicker/useLanguage'
import { StarIcon } from '@/theme'
import { Name } from '@oodikone/shared/types'

export const PrimaryCourseLabel = ({ code, name }: { code: string; name: string }) => (
  <Chip
    color={'primary'}
    icon={<StarIcon fontSize="small" />}
    label={
      <Stack direction="row" divider={<span>•</span>} spacing={0.5}>
        <Typography fontSize="small">{code}</Typography>
        <Typography fontSize="small">{name}</Typography>
      </Stack>
    }
  />
)

export const SecondaryCourseLabel = ({
  group,
  getTextIn,
}: {
  group: { code: string; name: Name }[]
  getTextIn: GetTextIn
}) => <GroupChip getTextIn={getTextIn} group={group.map(code => code)} separator={' • '} />
