import { Container, Stack } from '@mui/material'
import { useParams } from 'react-router'
import { Card, Divider, Loader, Message } from 'semantic-ui-react'

import { isDefaultServiceProvider } from '@/common'
import { useTitle } from '@/hooks/title'
import { useGetUserQuery } from '@/redux/users'
import { AccessGroups } from './AccessGroups'
import { AccessRights } from './AccessRights'
import { EmailNotification } from './EmailNotification'
import { InfoCard } from './InfoCard'
import { MissingIdAlert } from './MissingIdAlert'

export const UserPage = () => {
  const { userid } = useParams()
  const { data: user, isLoading, isError, error } = useGetUserQuery(userid)

  useTitle(user?.name ? `${user.name} - Users` : 'Users')

  if (isLoading) {
    return <Loader active inline="centered" />
  }

  if (isError) {
    return <Message header={error.data.error} icon="ban" negative size="big" />
  }

  return (
    <Container maxWidth="md">
      <Stack direction="column" gap={2}>
        <MissingIdAlert visible={!user.sisPersonId} />
        <InfoCard user={user} />
        <Card fluid>
          <Card.Content>
            <Card.Header content="Roles" />
            <AccessGroups user={user} />
          </Card.Content>
        </Card>
        <Card fluid>
          <Card.Content>
            <Card.Header content="Study programme access rights" />
            <Divider />
            <AccessRights user={user} />
          </Card.Content>
        </Card>
        {isDefaultServiceProvider() && (
          <Card fluid>
            <Card.Content>
              <Card.Header content="Send email about receiving access to Oodikone" />
              <Card.Description>
                <Divider />
                <EmailNotification userEmail={user.email} />
              </Card.Description>
            </Card.Content>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
