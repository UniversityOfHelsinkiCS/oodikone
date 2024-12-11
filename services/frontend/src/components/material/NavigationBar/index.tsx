import { AppBar, Box, Container, Tab, Tabs, Toolbar } from '@mui/material'
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { checkUserAccess, getFullStudyProgrammeRights, isDefaultServiceProvider } from '@/common'
import { hasFullAccessToTeacherData } from '@/components/Teachers/util'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { NavigationButton } from './NavigationButton'
import { NavigationItem, navigationItems } from './navigationItems'
import { OodikoneLogo } from './OodikoneLogo'
import { UserButton } from './UserButton'

export const NavigationBar = () => {
  const location = useLocation()
  const { fullAccessToStudentData, isAdmin, isLoading, programmeRights, roles, iamGroups } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  const [activeTab, setActiveTab] = useState<number | false>(false)

  const isActivePath = (mainPath: string | undefined, subPaths: (string | undefined)[] = []) => {
    const allPaths = [mainPath, ...subPaths].filter(Boolean)
    return allPaths.some(currentPath => location.pathname.includes(currentPath))
  }

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

  useEffect(() => {
    const activeTabIndex = Object.entries(visibleNavigationItems).findIndex(([_key, item]) => {
      const subItemPaths = item.items ? item.items.map(subItem => subItem.path) : []
      return isActivePath(item.path, subItemPaths)
    })

    setActiveTab(activeTabIndex >= 0 ? activeTabIndex : false)
  }, [location.pathname, visibleNavigationItems])

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box
            data-cy="nav-bar"
            sx={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <OodikoneLogo />
            {!isLoading && location && (
              <Tabs
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: theme => theme.palette.activeNavigationTab,
                  },
                }}
                textColor="inherit"
                value={activeTab}
                variant="scrollable"
              >
                {Object.entries(visibleNavigationItems).map(([key, item]) => (
                  <Tab
                    component={item.path ? Link : 'div'}
                    data-cy={`nav-bar-button-${key}`}
                    key={key}
                    label={<NavigationButton item={item} />}
                    sx={{
                      opacity: 1,
                      '&:hover': {
                        color: 'inherit',
                        opacity: 0.7,
                      },
                    }}
                    to={item.path ?? ''}
                  />
                ))}
              </Tabs>
            )}
            <UserButton />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
