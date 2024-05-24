import { useHistory, useParams } from 'react-router-dom'
import { Button, Card, Divider, Loader, Message, Popup, Segment } from 'semantic-ui-react'

import { useGetAuthorizedUserQuery, useShowAsUser } from '@/redux/auth'
import { useGetUserQuery } from '@/redux/users'
import { AccessGroups } from './AccessGroups'
import { AccessRights } from './AccessRights'
import { EmailNotification } from './EmailNotification'

export const UserPage = () => {
  const history = useHistory()

  const { userid } = useParams()
  const { username: currentUserName, isAdmin } = useGetAuthorizedUserQuery()
  const showAsUser = useShowAsUser()
  const { data: user, isLoading, isError, error } = useGetUserQuery(userid)

  if (isLoading) return <Loader active inline="centered" />

  if (isError) return <Message header={error.data.error} icon="ban" negative size="big" />

  const renderUserInfoCard = () => (
    <Card fluid>
      <Card.Content>
        <Card.Header>
          {isAdmin && user.username !== currentUserName && (
            <Popup
              content="Show Oodikone as this user"
              trigger={
                <Button
                  basic
                  circular
                  floated="right"
                  icon="spy"
                  onClick={() => showAsUser(user.username)}
                  size="tiny"
                />
              }
            />
          )}
          {user.name}
        </Card.Header>
        <Divider />
        <Card.Meta content={user.username} />
        <Card.Meta content={user.email} />
      </Card.Content>
    </Card>
  )

  return (
    <Segment className="contentSegment" loading={isLoading}>
      <Button content="Back" icon="arrow circle left" onClick={() => history.push('/users')} />
      <Divider />
      <Card.Group>
        {!user.sisPersonId && (
          <Message
            content="All their roles and access rights might not be displayed."
            header="This user does not have a person id"
            icon="exclamation circle"
            info
            negative
            style={{ margin: '1rem 0' }}
          />
        )}
        {renderUserInfoCard()}
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
        <Card fluid>
          <Card.Content>
            <Card.Header content="Send email about receiving access to Oodikone" />
            <Card.Description>
              <Divider />
              <EmailNotification userEmail={user.email} />
            </Card.Description>
          </Card.Content>
        </Card>
      </Card.Group>
    </Segment>
  )
}
