import Chip from '@mui/material/Chip'

import { Role } from '@oodikone/shared/types'

export const RoleChip = ({ role }: { role: Role }) => {
  return <Chip label={role} size="small" sx={{ backgroundColor: theme => theme.palette.roles[role] }} />
}
