import Chip from '@mui/material/Chip'
import { SwapHorizIcon } from '@/theme'

export const GroupChip = ({ group, separator = ", " }: { group: string[], separator: string }) => (
  <Chip
    icon={<SwapHorizIcon color="primary" fontSize="small" />}
    label={group.join(separator)}
    sx={{ my: 0.25, width: 'fit-content' }}
  />
)
