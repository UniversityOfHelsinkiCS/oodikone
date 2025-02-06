import { Logout as LogoutIcon } from '@mui/icons-material'
import { ListItemIcon, MenuItem, Typography } from '@mui/material'

import { isDev } from '@/conf'
import { useLogoutMutation } from '@/redux/auth'

export const LogOutButton = () => {
  const [logout] = useLogoutMutation()

  return (
    <MenuItem disabled={isDev} onClick={() => logout()}>
      <ListItemIcon>
        <LogoutIcon color="error" />
      </ListItemIcon>
      <Typography color="error">Log out</Typography>
    </MenuItem>
  )
}
