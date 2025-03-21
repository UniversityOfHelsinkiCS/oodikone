import { Chip } from '@mui/material'

import { Role } from '@/shared/types'

export const RoleChip = ({ role }: { role: Role }) => {
  return <Chip label={role} size="small" sx={{ backgroundColor: theme => theme.palette.roles[role] }} />
}
