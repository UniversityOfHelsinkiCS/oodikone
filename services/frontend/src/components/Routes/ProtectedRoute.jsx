import React from 'react'
import { Route } from 'react-router-dom'
import { Container, Header, Message } from 'semantic-ui-react'

import { checkUserAccess } from '@/common'
import { useGetAuthorizedUserQuery } from '@/redux/auth'

const NoAccessToPageBanner = () => (
  <Container style={{ paddingTop: 50 }} text textAlign="justified">
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
  const { programmeRights, iamGroups, isAdmin, roles } = user

  const hasAccessToRoute = () => {
    if (isAdmin) return true
    const hasRequiredRoles = requiredRoles.length > 0 ? checkUserAccess(requiredRoles, roles) : true
    const hasRequiredRights = requireUserHasRights ? programmeRights.length > 0 : true
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
      if (rest.location.pathname.includes('university')) {
        return true
      }
      return roles?.length > 0 || programmeRights?.length > 0
    }
    if (rest.path.includes('university')) {
      return true
    }

    return hasRequiredRoles && hasRequiredRights
  }

  return hasAccessToRoute() ? <Route {...rest} /> : <NoAccessToPageBanner />
}
