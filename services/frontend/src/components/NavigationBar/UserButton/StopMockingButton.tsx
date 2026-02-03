import ListItemIcon from '@mui/material/ListItemIcon'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

import { useShowAsUser } from '@/redux/auth'
import { LogoutIcon } from '@/theme'

export const StopMockingButton = () => {
  const showAsUser = useShowAsUser()

  return (
    <MenuItem onClick={() => showAsUser(null)}>
      <ListItemIcon>
        <LogoutIcon color="warning" />
      </ListItemIcon>
      <Typography color="warning">Stop mocking</Typography>
    </MenuItem>
  )
}
