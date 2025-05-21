import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import ListItemIcon from '@mui/material/ListItemIcon'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

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
