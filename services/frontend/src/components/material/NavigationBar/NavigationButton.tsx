import { Button, Menu, MenuItem } from '@mui/material'
import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'

import { checkUserAccess, getFullStudyProgrammeRights, isDefaultServiceProvider } from '@/common'
import { languageCenterViewEnabled } from '@/conf'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { NavigationItem } from './navigationItems'

export const NavigationButton = ({ item }: { item: NavigationItem }) => {
  const { iamGroups, programmeRights, roles } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const { key, label, path, items } = item

  const showSearch = (subItemKey: string) => {
    if (subItemKey === 'class' || subItemKey === 'overview') {
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

    if (subItemKey === 'completedCoursesSearch') {
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

  const style = {
    color: 'inherit',
    mx: 1,
    '&:hover': {
      color: 'inherit',
      textDecoration: 'underline',
    },
    whiteSpace: 'nowrap',
  }

  if (items) {
    return (
      <Fragment key={`menu-item-drop-${key}`}>
        <Button data-cy={`navbar-${key}`} onClick={event => setAnchorEl(event.currentTarget)} sx={style}>
          {label}
        </Button>
        <Menu anchorEl={anchorEl} onClose={() => setAnchorEl(null)} open={Boolean(anchorEl)}>
          {items.map(
            subItem =>
              showSearch(subItem.key) && (
                <MenuItem
                  component={Link}
                  data-cy={`navbar-${subItem.key}`}
                  key={`menu-item-${subItem.path}`}
                  onClick={() => setAnchorEl(null)}
                  to={subItem.path}
                >
                  {subItem.label}
                </MenuItem>
              )
          )}
        </Menu>
      </Fragment>
    )
  }

  return (
    <Button component={Link} data-cy={`navbar-${key}`} key={`menu-item-${path}`} sx={style} to={path}>
      {label}
    </Button>
  )
}
