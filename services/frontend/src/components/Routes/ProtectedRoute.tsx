import { Outlet, useLocation } from 'react-router'
import { checkUserAccess } from '@/common'
import { hasFullAccessToTeacherData } from '@/components/Teachers/util'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { Role } from '@/shared/types'
import { AccessDeniedMessage } from './AccessDeniedMessage'

interface ProtectedRouteProps {
  requiredRoles?: Role[]
  requireUserHasRights?: boolean
}

export const ProtectedRoute = ({ requiredRoles = [], requireUserHasRights = false }: ProtectedRouteProps) => {
  const { iamGroups, isAdmin, programmeRights, roles } = useGetAuthorizedUserQuery()
  const location = useLocation()
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

  if (!hasAccessToRoute()) {
    return <AccessDeniedMessage />
  }

  return <Outlet />
}
