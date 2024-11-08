import { AppBar, Box, Container, Toolbar } from '@mui/material'
import { Fragment } from 'react'

import { checkUserAccess, getFullStudyProgrammeRights, isDefaultServiceProvider } from '@/common'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { Logo } from './Logo'
import { NavigationButton } from './NavigationButton'
import { NavigationDivider } from './NavigationDivider'
import { NavigationItem, navigationItems } from './navigationItems'
import { UserButton } from './UserButton'

export const NavigationBar = () => {
  const { fullAccessToStudentData, isAdmin, isLoading, programmeRights, roles } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  const refreshNavigationRoutes = () => {
    const visibleNavigationItems: Record<string, NavigationItem> = {}
    if (isLoading) {
      return visibleNavigationItems
    }
    Object.keys(navigationItems).forEach(key => {
      if (key === 'populations') {
        if (!fullAccessToStudentData && programmeRights.length === 0) return
      }
      if (key === 'students') {
        if (
          !checkUserAccess(['admin', 'fullSisuAccess', 'studyGuidanceGroups'], roles) &&
          fullStudyProgrammeRights.length === 0
        ) {
          return
        }
      } else if (key === 'courseStatistics') {
        if (
          !checkUserAccess(['admin', 'fullSisuAccess', 'courseStatistics'], roles) &&
          fullStudyProgrammeRights.length === 0
        ) {
          return
        }
      } else if (key === 'faculty') {
        if (!checkUserAccess(['admin', 'fullSisuAccess', 'facultyStatistics'], roles)) return
      } else if (key === 'feedback') {
        if (!isDefaultServiceProvider()) return
      }
      const { reqRights } = navigationItems[key]
      if (!reqRights || reqRights.every(r => roles.includes(r) || (key === 'teachers' && isAdmin))) {
        visibleNavigationItems[key] = navigationItems[key]
      }
    })
    return { ...visibleNavigationItems }
  }

  const visibleNavigationItems = refreshNavigationRoutes()

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Logo />
          <Box sx={{ display: 'flex', flexGrow: 1 }}>
            {Object.values(visibleNavigationItems).map(item => (
              <Fragment key={item.key}>
                {['feedback', 'admin'].includes(item.key) && <NavigationDivider />}
                <NavigationButton item={item} />
              </Fragment>
            ))}
          </Box>
          <UserButton />
        </Toolbar>
      </Container>
    </AppBar>
  )
}
