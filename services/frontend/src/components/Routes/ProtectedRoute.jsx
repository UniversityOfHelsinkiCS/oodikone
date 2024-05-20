import { Route } from 'react-router-dom'
import { Container, Icon, Message } from 'semantic-ui-react'

import { checkUserAccess } from '@/common'
import { useGetAuthorizedUserQuery } from '@/redux/auth'

const NoAccessToPageBanner = () => (
  <Container style={{ paddingTop: 50 }} text textAlign="justified">
    <Message icon negative>
      <Icon name="ban" />
      <Message.Content>
        <Message.Header>Access denied</Message.Header>
        <p>
          You don't currently have permission to view this page. If you believe this is a mistake, please contact{' '}
          <a href="mailto:oodikone@helsinki.fi">oodikone@helsinki.fi</a>.
        </p>
      </Message.Content>
    </Message>
  </Container>
)

export const ProtectedRoute = ({ requiredRoles = [], requireUserHasRights = false, ...rest }) => {
  const { programmeRights, iamGroups, isAdmin, roles } = useGetAuthorizedUserQuery()
  const fullSisuAccessRoutes = ['populations', 'students', 'custompopulation', 'study-programme', 'coursepopulation']

  const hasAccessToRoute = () => {
    if (isAdmin) return true
    const hasRequiredRoles = requiredRoles.length > 0 ? checkUserAccess(requiredRoles, roles) : true
    const hasRequiredRights = requireUserHasRights ? programmeRights.length > 0 : true
    if (requiredRoles.includes('courseStatistics')) {
      return hasRequiredRoles || hasRequiredRights
    }
    if (fullSisuAccessRoutes.some(route => rest.path.includes(route))) {
      return hasRequiredRoles || hasRequiredRights
    }
    if (rest.path.includes('languagecenterview')) {
      return iamGroups.includes('grp-kielikeskus-esihenkilot')
    }
    if (rest.path.includes('evaluationoverview')) {
      return rest.location.pathname.includes('university') ? true : hasRequiredRoles
    }

    return hasRequiredRoles && hasRequiredRights
  }

  return hasAccessToRoute() ? <Route {...rest} /> : <NoAccessToPageBanner />
}
