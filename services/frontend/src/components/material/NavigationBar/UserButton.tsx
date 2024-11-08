import { Avatar, Box, IconButton, Menu, MenuItem, Typography } from '@mui/material'
import { useState } from 'react'

const settings = ['Language', 'Privacy', 'Theme', 'Logout']

export const UserButton = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  return (
    <Box sx={{ flexGrow: 0 }}>
      <IconButton onClick={event => setAnchorEl(event.currentTarget)} sx={{ p: 0 }}>
        <Avatar />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'top',
        }}
        id="menu-appbar"
        keepMounted
        onClose={() => setAnchorEl(null)}
        open={Boolean(anchorEl)}
        sx={{ mt: '45px' }}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top',
        }}
      >
        {settings.map(setting => (
          <MenuItem key={setting} onClick={event => setAnchorEl(event.currentTarget)}>
            <Typography sx={{ textAlign: 'center' }}>{setting}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}
