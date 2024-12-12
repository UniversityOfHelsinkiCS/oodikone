import { useLocation } from 'react-router-dom'

import { checkUserAccess } from '@/common'
import { hasFullAccessToTeacherData } from '@/components/Teachers/util'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { Role } from '@/shared/types'
import { AccessDeniedMessage } from './AccessDeniedMessage'

interface ProtectedRouteProps {
  element: JSX.Element
  requiredRoles?: Role[]
  requireUserHasRights?: boolean
}

export const ProtectedRoute = ({ element, requiredRoles = [], requireUserHasRights = false }: ProtectedRouteProps) => {
  const location = useLocation()
  const { iamGroups, isAdmin, programmeRights, roles } = useGetAuthorizedUserQuery()
  const fullSisuAccessRoutes = ['populations', 'students', 'custompopulation', 'study-programme', 'coursepopulation']

  const hasAccessToRoute = () => {
    if (isAdmin) return true
    const hasRequiredRoles = requiredRoles.length > 0 ? checkUserAccess(requiredRoles, roles) : true
    const hasRequiredRights = requireUserHasRights ? programmeRights.length > 0 : true
    if (requiredRoles.includes('courseStatistics')) {
      return hasRequiredRoles || hasRequiredRights
    }
    if (fullSisuAccessRoutes.some(route => location.pathname.includes(route))) {
      return hasRequiredRoles || hasRequiredRights
    }
    if (location.pathname.includes('languagecenterview')) {
      return iamGroups.includes('grp-kielikeskus-esihenkilot')
    }
    if (location.pathname.includes('teachers')) {
      return hasRequiredRoles || hasFullAccessToTeacherData(roles, iamGroups)
    }

    return hasRequiredRoles && hasRequiredRights
  }

  return hasAccessToRoute() ? element : <AccessDeniedMessage />
}
