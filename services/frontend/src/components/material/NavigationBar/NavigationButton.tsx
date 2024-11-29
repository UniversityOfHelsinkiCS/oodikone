import { ArrowDropDown as ArrowDropDownIcon } from '@mui/icons-material'
import { Menu, MenuItem, Typography } from '@mui/material'
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

  if (items) {
    return (
      <>
        <Typography
          color="inherit"
          data-cy={`nav-bar-button-${key}`}
          onClick={event => setAnchorEl(event.currentTarget)}
          sx={{ display: 'flex' }}
          variant="button"
        >
          {label} <ArrowDropDownIcon />
        </Typography>
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
    <Typography
      color="inherit"
      component={Link}
      data-cy={`nav-bar-button-${key}`}
      sx={{ '&:hover': { color: 'inherit' } }}
      to={path}
      variant="button"
    >
      {label}
    </Typography>
  )
}
