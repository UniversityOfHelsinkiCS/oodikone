import { ExitToApp as ExitToAppIcon } from '@mui/icons-material'
import { ListItemIcon, MenuItem, Typography } from '@mui/material'

import { useShowAsUser } from '@/redux/auth'

export const StopMockingButton = () => {
  const showAsUser = useShowAsUser()

  return (
    <MenuItem onClick={() => showAsUser(null)}>
      <ListItemIcon>
        <ExitToAppIcon color="warning" />
      </ListItemIcon>
      <Typography color="warning">Stop mocking</Typography>
    </MenuItem>
  )
}
