import { AccountCircle as AccountCircleIcon, Check as CheckIcon, Language as LanguageIcon } from '@mui/icons-material'
import { Badge, Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material'
import { useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { LANGUAGE_CODES, LANGUAGE_TEXTS } from '@oodikone/shared/language'
import { LogOutButton } from './LogOutButton'
import { StopMockingButton } from './StopMockingButton'

export const UserButton = () => {
  const { language, setLanguage } = useLanguage()
  const { isLoading, mockedBy, username } = useGetAuthorizedUserQuery()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const languageOptions = LANGUAGE_CODES.map(code => ({
    key: code,
    text: LANGUAGE_TEXTS[code],
    value: code,
  }))

  return (
    <Box>
      <IconButton
        data-cy="nav-bar-user-button"
        onClick={event => setAnchorEl(event.currentTarget)}
        sx={{ color: 'inherit', padding: 0 }}
      >
        <Badge color="warning" invisible={!mockedBy} variant="dot">
          <AccountCircleIcon />
        </Badge>
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
              {mockedBy ? 'Mocking' : 'Logged in'} as <b>{username}</b>
            </Typography>
          </MenuItem>
        )}
        <Divider />
        <MenuItem sx={{ pointerEvents: 'none' }}>
          <ListItemIcon>
            <LanguageIcon />
          </ListItemIcon>
          <Typography>Language</Typography>
        </MenuItem>
        {languageOptions.map(({ key, text, value }) => (
          <MenuItem key={key} onClick={() => setLanguage(value)} selected={language === value}>
            <ListItemIcon>{language === value ? <CheckIcon fontSize="small" /> : null}</ListItemIcon>
            <Typography fontWeight={language === value ? 'bold' : 'normal'}>{text}</Typography>
          </MenuItem>
        ))}
        <Divider />
        {mockedBy ? <StopMockingButton /> : <LogOutButton />}
      </Menu>
    </Box>
  )
}
