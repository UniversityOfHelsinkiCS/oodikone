import { AppBar, Box, Container, Toolbar } from '@mui/material'

import { Logo } from './Logo'
import { NavigationButton } from './NavigationButton'
import { NavigationDivider } from './NavigationDivider'
import { adminItems, statisticsItems, oodikoneItems } from './navigationItems'
import { UserButton } from './UserButton'

export const NavigationBar = () => {
  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Logo />
          <Box sx={{ display: 'flex', flexGrow: 1 }}>
            {Object.values(statisticsItems).map(item => (
              <NavigationButton item={item} key={item.key} />
            ))}
            <NavigationDivider />
            {Object.values(oodikoneItems).map(item => (
              <NavigationButton item={item} key={item.key} />
            ))}
            <NavigationDivider />
            {Object.values(adminItems).map(item => (
              <NavigationButton item={item} key={item.key} />
            ))}
          </Box>
          <UserButton />
        </Toolbar>
      </Container>
    </AppBar>
  )
}
