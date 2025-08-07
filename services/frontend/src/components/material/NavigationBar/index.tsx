import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Toolbar from '@mui/material/Toolbar'

import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router'

import { isDefaultServiceProvider } from '@/common'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { checkUserAccess, getFullStudyProgrammeRights, hasFullAccessToTeacherData } from '@/util/access'
import { formatToArray } from '@oodikone/shared/util'
import { NavigationButton } from './NavigationButton'
import { navigationItems } from './navigationItems'
import { OodikoneLogo } from './OodikoneLogo'
import { UserButton } from './UserButton'

export const NavigationBar = () => {
  const { isFetching, fullAccessToStudentData, isAdmin, programmeRights, roles, iamGroups } =
    useGetAuthorizedUserQuery()

  const location = useLocation()
  const [activeTab, setActiveTab] = useState<number>(-1)

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  const visibleNavigationItems = useMemo(
    () =>
      Object.entries(!isFetching ? navigationItems : {})
        .filter(([key, _]) => {
          if (key === 'populations' && !fullAccessToStudentData && !programmeRights.length) return false

          if (
            key === 'students' &&
            !checkUserAccess(['admin', 'fullSisuAccess', 'studyGuidanceGroups'], roles) &&
            !fullStudyProgrammeRights.length
          )
            return false

          if (
            key === 'courseStatistics' &&
            !checkUserAccess(['admin', 'fullSisuAccess', 'courseStatistics'], roles) &&
            !fullStudyProgrammeRights.length
          )
            return false

          if (key === 'faculty' && !checkUserAccess(['admin', 'fullSisuAccess', 'facultyStatistics'], roles))
            return false

          if (key === 'feedback' && !isDefaultServiceProvider()) return false

          if (key === 'admin' && !isAdmin) return false

          if (
            key === 'teachers' &&
            !checkUserAccess(['teachers'], roles) &&
            !hasFullAccessToTeacherData(roles, iamGroups)
          )
            return false

          const { reqRights } = navigationItems[key]
          if (!reqRights || reqRights.every(role => roles.includes(role))) return true

          return false
        })
        .map(([_, value]) => value),
    [isFetching, fullAccessToStudentData, isAdmin, programmeRights, roles, iamGroups]
  )

  const isActivePath = (paths: string[]) =>
    paths.filter((path): path is string => Boolean(path)).some(currentPath => location.pathname.includes(currentPath))

  useEffect(
    () =>
      setActiveTab(
        visibleNavigationItems.findIndex(item =>
          isActivePath(formatToArray(item.path ?? item.items?.map(subPath => subPath.path!) ?? []))
        )
      ),
    [location.pathname, visibleNavigationItems]
  )

  return (
    <AppBar elevation={0} position="static">
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
            {!isFetching && location ? (
              <Tabs
                sx={{ '& .MuiTabs-indicator': { backgroundColor: 'activeNavigationTab' } }}
                textColor="inherit"
                value={0 <= activeTab ? activeTab : false}
                variant="scrollable"
              >
                {visibleNavigationItems.map(item => (
                  <Tab
                    component={item?.path ? Link : 'div'}
                    data-cy={`nav-bar-button-${item.key}`}
                    key={item.key}
                    label={<NavigationButton item={item} />}
                    sx={{
                      p: 0,
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
            ) : null}
            <UserButton />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
