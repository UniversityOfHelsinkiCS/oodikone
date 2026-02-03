import ListItemIcon from '@mui/material/ListItemIcon'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

import { isDev } from '@/conf'
import { useLogoutMutation } from '@/redux/auth'
import { LogoutIcon } from '@/theme'

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
