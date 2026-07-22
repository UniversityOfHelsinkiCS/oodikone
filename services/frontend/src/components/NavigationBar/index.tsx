import AppBar from '@mui/material/AppBar'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Toolbar from '@mui/material/Toolbar'

import { useMemo } from 'react'
import { useLocation } from 'react-router'

import { Link } from '@/components/common/Link'
import { NavigationButton } from '@/components/NavigationBar/NavigationButton'
import { navigationItems } from '@/components/NavigationBar/navigationItems'
import { OodikoneLogo } from '@/components/NavigationBar/OodikoneLogo'
import { UserButton } from '@/components/NavigationBar/UserButton'
import { isDev } from '@/conf'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { checkUserAccess, getFullStudyProgrammeRights, hasFullAccessToTeacherData } from '@/util/access'

export const NavigationBar = () => {
  'use memo'
  const { isFetching, fullAccessToStudentData, isAdmin, programmeRights, roles, iamGroups } =
    useGetAuthorizedUserQuery()

  const location = useLocation()

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
    [isFetching, fullAccessToStudentData, fullStudyProgrammeRights.length, isAdmin, programmeRights, roles, iamGroups]
  )

  const isActivePath = (paths: string[]) =>
    paths.filter((path): path is string => Boolean(path)).some(currentPath => location.pathname.includes(currentPath))

  const activeTab = useMemo(() => {
    return visibleNavigationItems.findIndex(item => {
      const paths =
        item.path !== undefined ? [item.path] : (item.items ?? []).map(sub => sub.path).filter(sp => sp !== undefined)

      return isActivePath(paths)
    })
  }, [visibleNavigationItems, isActivePath, location.pathname])

  return (
    <AppBar
      elevation={0}
      position="static"
      sx={theme =>
        isDev
          ? {
              background: `linear-gradient(-45deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
              backgroundSize: '300% 150%',
              animation: 'gradient-shift 15s ease-in-out infinite',
            }
          : {}
      }
    >
      <Toolbar
        data-cy="nav-bar"
        disableGutters
        sx={{
          mx: 'auto',
          px: 3,
          maxWidth: 'xl',
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <OodikoneLogo />
        {!isFetching && location && (
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
        )}
        <UserButton />
      </Toolbar>
    </AppBar>
  )
}
