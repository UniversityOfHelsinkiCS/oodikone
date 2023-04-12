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

const ProtectedRoute = ({ requiredRoles = [], requireUserHasRights = false, ...rest }) => {
  const { rights, iamRights, isAdmin, roles } = useGetAuthorizedUserQuery()
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
    if (rest.path.includes('courseprerequisites')) {
      return hasRequiredRoles || hasRequiredRights
    }
    return hasRequiredRoles && hasRequiredRights
  }

  return hasAccessToRoute() ? <Route {...rest} /> : <NoAccessToPageBanner />
}

export default ProtectedRoute
