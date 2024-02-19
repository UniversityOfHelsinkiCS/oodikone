import React, { useEffect } from 'react'
import { Button, Card, Divider, Popup, Dropdown, Segment, Loader, Message } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { sortBy } from 'lodash-es'
import { useHistory, useParams } from 'react-router-dom'

import { useGetAuthorizedUserQuery, useShowAsUser } from 'redux/auth'
import { setFaculties, useGetUserQuery } from 'redux/users'
import { getFaculties } from 'redux/faculties'
import { textAndDescriptionSearch } from '../../common'
import { AccessRights } from './AccessRights'
import { AccessGroups } from './AccessGroups'
import { EmailNotification } from './EmailNotification'
import { useLanguage } from '../LanguagePicker/useLanguage'

const UserPage = ({ faculties, setFaculties, getFaculties }) => {
  const history = useHistory()

  const { userid } = useParams()
  const { getTextIn } = useLanguage()
  const { userId: currentUserId, isAdmin } = useGetAuthorizedUserQuery()
  const showAsUser = useShowAsUser()
  const { data: user, isLoading, isError, error } = useGetUserQuery(userid)

  useEffect(() => {
    if (faculties.length === 0) getFaculties()
  }, [])

  if (isLoading) return <Loader active inline="centered" />

  if (isError) return <Message negative size="big" icon="ban" header={error.data.error} />

  const renderUserInfoCard = () => (
    <Card fluid>
      <Card.Content>
        <Card.Header>
          {isAdmin && user.username !== currentUserId && (
            <Popup
              content="Show Oodikone as this user"
              trigger={
                <Button
                  floated="right"
                  circular
                  size="tiny"
                  basic
                  icon="spy"
                  onClick={() => showAsUser(user.username)}
                />
              }
            />
          )}
          {user.full_name}
        </Card.Header>
        <Divider />
        <Card.Meta content={user.username} />
        <Card.Meta content={user.email} />
      </Card.Content>
    </Card>
  )

  const renderFacultyAccessRights = () => (
    <Card fluid>
      <Card.Content>
        <Card.Header content="Faculty access rights" />
        <Card.Description>
          <Dropdown
            placeholder="Select faculties"
            fluid
            selection
            multiple
            value={user.faculty.map(f => f.faculty_code)}
            options={sortBy(
              faculties.map(f => ({ key: f.code, text: getTextIn(f.name), description: f.code, value: f.code })),
              ['text']
            )}
            onChange={(__, { value: facultycodes }) => setFaculties(user.id, facultycodes)}
            search={textAndDescriptionSearch}
            selectOnBlur={false}
            selectOnNavigation={false}
          />
        </Card.Description>
      </Card.Content>
    </Card>
  )

  return (
    <Segment loading={isLoading} className="contentSegment">
      <div>
        <Button icon="arrow circle left" content="Back" onClick={() => history.push('/users')} />
        <Divider />
        <Card.Group>
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
          {renderFacultyAccessRights()}
          <Card fluid>
            <Card.Content>
              <Card.Header content="Send email about receiving access to oodikone" />
              <Card.Description>
                <Divider />
                <EmailNotification userEmail={user.email} />
              </Card.Description>
            </Card.Content>
          </Card>
        </Card.Group>
      </div>
    </Segment>
  )
}

const mapStateToProps = state => ({
  faculties: state.faculties.data,
})

export const ConnectedUserPage = connect(mapStateToProps, { setFaculties, getFaculties })(UserPage)
