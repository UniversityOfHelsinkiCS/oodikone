import { ArrowDropDown } from '@mui/icons-material'
import { Button, Menu, MenuItem } from '@mui/material'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { checkUserAccess, getFullStudyProgrammeRights, isDefaultServiceProvider } from '@/common'
import { languageCenterViewEnabled } from '@/conf'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { NavigationItem } from './navigationItems'

export const NavigationButton = ({ item }: { item: NavigationItem }) => {
  const { iamGroups, programmeRights, roles } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const { key, label, path, items } = item

  const showItem = (subItemKey: string) => {
    if (['class', 'completedCoursesSearch', 'overview'].includes(subItemKey)) {
      return true
    }

    if (
      checkUserAccess(['admin', 'openUniSearch'], roles) &&
      subItemKey === 'openUniSearch' &&
      isDefaultServiceProvider()
    ) {
      return true
    }

    if (
      (checkUserAccess(['admin', 'fullSisuAccess', 'studyGuidanceGroups'], roles) ||
        fullStudyProgrammeRights.length > 0) &&
      subItemKey === 'customSearch'
    ) {
      return true
    }

    if (
      (checkUserAccess(['admin'], roles) || iamGroups.includes('grp-kielikeskus-esihenkilot')) &&
      subItemKey === 'languageCenterView' &&
      languageCenterViewEnabled
    ) {
      return true
    }

    if (
      subItemKey === 'closeToGraduation' &&
      checkUserAccess(['admin', 'fullSisuAccess', 'studyGuidanceGroups'], roles)
    ) {
      return true
    }

    if (['users', 'updater'].includes(subItemKey) && checkUserAccess(['admin'], roles)) {
      return true
    }

    return false
  }

  const isActivePath = (mainPath: string | undefined, subPaths: (string | undefined)[] = []) => {
    const allPaths = [mainPath, ...subPaths].filter(Boolean)
    return allPaths.some(currentPath => location.pathname.includes(currentPath!))
  }

  const subItemPaths = items ? items.map(subItem => subItem.path) : []
  const isActive = isActivePath(path, subItemPaths)

  const buttonStyle = {
    color: 'inherit',
    fontWeight: isActive ? 'bold' : 'normal',
    textTransform: 'none',
    whiteSpace: 'nowrap',
    '&:hover': {
      color: 'inherit',
      textDecoration: 'underline',
    },
  }

  if (items) {
    return (
      <>
        <Button
          data-cy={`nav-bar-button-${key}`}
          endIcon={<ArrowDropDown />}
          onClick={event => setAnchorEl(event.currentTarget)}
          sx={buttonStyle}
        >
          {label}
        </Button>
        <Menu anchorEl={anchorEl} onClose={() => setAnchorEl(null)} open={Boolean(anchorEl)}>
          {items.map(
            subItem =>
              showItem(subItem.key) && (
                <MenuItem
                  component={Link}
                  data-cy={`nav-bar-button-${subItem.key}`}
                  key={subItem.path}
                  onClick={() => setAnchorEl(null)}
                  selected={location.pathname.includes(subItem.path)}
                  to={subItem.path}
                >
                  {subItem.label}
                </MenuItem>
              )
          )}
        </Menu>
      </>
    )
  }

  return (
    <Button component={Link} data-cy={`nav-bar-button-${key}`} sx={buttonStyle} to={path}>
      {label}
    </Button>
  )
}
