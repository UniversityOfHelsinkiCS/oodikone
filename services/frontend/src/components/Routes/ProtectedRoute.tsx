import { Route } from 'react-router-dom'

import { checkUserAccess } from '@/common'
import { hasFullAccessToTeacherData } from '@/components/Teachers/util'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { Role } from '@/shared/types'
import { AccessDeniedMessage } from './AccessDeniedMessage'

export const ProtectedRoute = ({
  component,
  location,
  path,
  requiredRoles = [],
  requireUserHasRights = false,
  ...rest
}: {
  component: JSX.Element
  location: { hash: string; pathname: string; search: string; state: any }
  path: string
  requiredRoles: Role[]
  requireUserHasRights: boolean
}) => {
  const { iamGroups, isAdmin, programmeRights, roles } = useGetAuthorizedUserQuery()
  const fullSisuAccessRoutes = ['populations', 'students', 'custompopulation', 'study-programme', 'coursepopulation']

  const hasAccessToRoute = () => {
    if (isAdmin) return true
    const hasRequiredRoles = requiredRoles.length > 0 ? checkUserAccess(requiredRoles, roles) : true
    const hasRequiredRights = requireUserHasRights ? programmeRights.length > 0 : true
    if (requiredRoles.includes('courseStatistics')) {
      return hasRequiredRoles || hasRequiredRights
    }
    if (fullSisuAccessRoutes.some(route => path.includes(route))) {
      return hasRequiredRoles || hasRequiredRights
    }
    if (path.includes('languagecenterview')) {
      return iamGroups.includes('grp-kielikeskus-esihenkilot')
    }
    if (path.includes('teachers')) {
      return hasRequiredRoles || hasFullAccessToTeacherData(roles, iamGroups)
    }

    return hasRequiredRoles && hasRequiredRights
  }

  if (hasAccessToRoute()) {
    return <Route component={component} exact location={location} path={path} {...rest} />
  }

  return <AccessDeniedMessage />
}
