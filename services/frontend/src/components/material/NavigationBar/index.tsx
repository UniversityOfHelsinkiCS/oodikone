import { AppBar, Box, Container, Toolbar } from '@mui/material'
import { Fragment } from 'react'

import { checkUserAccess, getFullStudyProgrammeRights, isDefaultServiceProvider } from '@/common'
import { hasFullAccessToTeacherData } from '@/components/Teachers/util'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { Logo } from './Logo'
import { NavigationButton } from './NavigationButton'
import { NavigationDivider } from './NavigationDivider'
import { NavigationItem, navigationItems } from './navigationItems'
import { UserButton } from './UserButton'

export const NavigationBar = () => {
  const { fullAccessToStudentData, isAdmin, isLoading, programmeRights, roles, iamGroups } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  const getVisibleNavigationItems = () => {
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
      } else if (key === 'admin') {
        if (!isAdmin) return
      } else if (key === 'teachers') {
        if (!checkUserAccess(['teachers'], roles) && !hasFullAccessToTeacherData(roles, iamGroups)) {
          return
        }
      }
      const { reqRights } = navigationItems[key]
      if (!reqRights || reqRights.every(role => roles.includes(role))) {
        visibleNavigationItems[key] = navigationItems[key]
      }
    })
    return { ...visibleNavigationItems }
  }

  const visibleNavigationItems = getVisibleNavigationItems()

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Logo />
          {!isLoading && (
            <>
              <Box data-cy="nav-bar" sx={{ display: 'flex', flexGrow: 1, justifyContent: 'space-between' }}>
                <NavigationDivider />
                {Object.values(visibleNavigationItems).map(item => (
                  <Fragment key={item.key}>
                    {['feedback', 'admin'].includes(item.key) && <NavigationDivider />}
                    <NavigationButton item={item} />
                  </Fragment>
                ))}
                <NavigationDivider />
              </Box>
              <UserButton />
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  )
}