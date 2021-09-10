import React from 'react'
import { Container, Header, Message } from 'semantic-ui-react'
import { useSelector } from 'react-redux'
import { Route } from 'react-router-dom'
import { getUserRoles, checkUserAccess, getUserIsAdmin } from '../../common'

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
  const { roles, rights } = useSelector(state => state.auth.token)
  const hasAccessToRoute = () => {
    if (getUserIsAdmin(roles)) return true
    const hasRequiredRoles = requiredRoles.length > 0 ? checkUserAccess(requiredRoles, getUserRoles(roles)) : true
    const hasRequiredRights = requireUserHasRights ? rights.length > 0 : true
    if (requiredRoles.includes('courseStatistics')) {
      return hasRequiredRoles || hasRequiredRights
    }
    return hasRequiredRoles && hasRequiredRights
  }

  return hasAccessToRoute() ? <Route {...rest} /> : <NoAccessToPageBanner />
}

export default ProtectedRoute
