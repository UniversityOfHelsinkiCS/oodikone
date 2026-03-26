import Chip from '@mui/material/Chip'
import { SwapHorizIcon } from '@/theme'

export const GroupChip = ({ group }: { group: string[] }) => (
  <Chip
    icon={<SwapHorizIcon color="primary" fontSize="small" />}
    label={group.join(', ')}
    sx={{ my: 0.25, width: 'fit-content' }}
  />
)
