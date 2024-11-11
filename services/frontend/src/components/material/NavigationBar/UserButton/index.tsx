import { AccountCircle, Check, Language } from '@mui/icons-material'
import { Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material'
import { useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { LANGUAGE_CODES, LANGUAGE_TEXTS } from '@/shared/language'
import { LogOutButton } from './LogOutButton'
import { StopMockingButton } from './StopMockingButton'

export const UserButton = () => {
  const { language, setLanguage } = useLanguage()
  const { isLoading, mockedBy, username } = useGetAuthorizedUserQuery()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const currentLanguage: string = language as unknown as string // TODO: Fix the type in the origin

  const languageOptions = LANGUAGE_CODES.map(code => ({
    key: code,
    text: LANGUAGE_TEXTS[code],
    value: code,
  }))

  return (
    <Box sx={{ flexGrow: 0 }}>
      <IconButton color="inherit" onClick={event => setAnchorEl(event.currentTarget)} sx={{ p: 0 }}>
        <AccountCircle />
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
        {!isLoading && username && (
          <MenuItem sx={{ pointerEvents: 'none' }}>
            <Typography>
              {mockedBy ? 'Mocked' : 'Logged in'} as <b>{username}</b>
            </Typography>
          </MenuItem>
        )}
        <Divider />
        <MenuItem sx={{ pointerEvents: 'none' }}>
          <ListItemIcon>
            <Language />
          </ListItemIcon>
          <Typography>Language</Typography>
        </MenuItem>
        {languageOptions.map(({ key, text, value }) => (
          <MenuItem key={key} onClick={() => setLanguage(value)} selected={currentLanguage === value}>
            <ListItemIcon>{currentLanguage === value ? <Check fontSize="small" /> : null}</ListItemIcon>
            <Typography fontWeight={currentLanguage === value ? 'bold' : 'normal'}>{text}</Typography>
          </MenuItem>
        ))}
        <Divider />
        {mockedBy ? <StopMockingButton /> : <LogOutButton />}
      </Menu>
    </Box>
  )
}
