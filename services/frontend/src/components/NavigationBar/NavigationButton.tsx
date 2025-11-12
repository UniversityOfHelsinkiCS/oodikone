import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

import { useState } from 'react'
import { useLocation } from 'react-router'

import { isDefaultServiceProvider } from '@/common'
import { Link } from '@/components/common/Link'
import { languageCenterViewEnabled } from '@/conf'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { checkUserAccess, getFullStudyProgrammeRights } from '@/util/access'
import { NavigationItem } from './navigationItems'

export const NavigationButton = ({ item }: { item: NavigationItem }) => {
  const { iamGroups, programmeRights, roles } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const { label, items } = item

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
          onClick={event => setAnchorEl(event.currentTarget)}
          sx={{ display: 'flex', py: 1.5, px: 2 }}
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
                  key={subItem.path ?? ''}
                  onClick={() => setAnchorEl(null)}
                  selected={location.pathname?.includes(subItem.path ?? '') ?? false}
                  to={subItem.path ?? '/'}
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
    <Typography color="inherit" sx={{ py: 1.5, px: 2 }} variant="button">
      {label}
    </Typography>
  )
}
