import React from 'react'
import { Container, Header, Message } from 'semantic-ui-react'
import { Route } from 'react-router-dom'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import { checkUserAccess } from '../../common'

const NoAccessToPageBanner = () => (
  <Container text style={{ paddingTop: 50 }} textAlign="justified">
    <Header as="h1" textAlign="center">
      Access denied
    </Header>
    <Message>
      You're currently not allowed to see this page. Please contant{' '}
      <a href="mailto:oodikone@helsinki.fi">oodikone@helsinki.fi</a>, if this is a mistake.
    </Message>
  </Container>
)

export const ProtectedRoute = ({ requiredRoles = [], requireUserHasRights = false, ...rest }) => {
  const user = useGetAuthorizedUserQuery()
  const { rights, iamRights, iamGroups, isAdmin, roles } = user

  const hasAccessToRoute = () => {
    if (isAdmin) return true
    const hasRequiredRoles = requiredRoles.length > 0 ? checkUserAccess(requiredRoles, roles) : true
    const hasRequiredRights = requireUserHasRights ? rights.length > 0 || iamRights.length > 0 : true
    if (requiredRoles.includes('courseStatistics')) {
      return hasRequiredRoles || hasRequiredRights
    }
    if (rest.path.includes('students')) {
      return hasRequiredRoles || hasRequiredRights
    }
    if (rest.path.includes('custompopulation')) {
      return hasRequiredRoles || hasRequiredRights
    }
    if (rest.path.includes('languagecenterview')) {
      return iamGroups.includes('grp-kielikeskus-esihenkilot')
    }
    if (rest.path.includes('evaluationoverview')) {
      return roles.includes('katselmusViewer')
    }
    return hasRequiredRoles && hasRequiredRights
  }

  return hasAccessToRoute() ? <Route {...rest} /> : <NoAccessToPageBanner />
}
