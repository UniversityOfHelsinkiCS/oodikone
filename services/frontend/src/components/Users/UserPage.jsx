import React, { useEffect } from 'react'
import { Button, Card, Divider, List, Icon, Popup, Dropdown, Header } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { sortBy } from 'lodash'
import { withRouter } from 'react-router-dom'
import { useGetAuthorizedUserQuery, useShowAsUser } from 'redux/auth'
import { textAndDescriptionSearch } from '../../common'
import { removeUserUnits, setFaculties } from '../../redux/users'
import { getAccessGroups } from '../../redux/accessGroups'
import { getFaculties } from '../../redux/faculties'
import { getProgrammesUnfiltered } from '../../redux/populationProgrammesUnfiltered'
import AccessRights from './AccessRights'
import AccessGroups from './AccessGroups'
import EmailNotification from './EmailNotification'
import { getElementDetails } from '../../redux/elementdetails'
import useLanguage from '../LanguagePicker/useLanguage'

const UserPage = ({
  user,
  elementdetails,
  accessGroups,
  faculties,
  setFaculties,
  goBack,
  associations,
  pending,
  getElementDetails,
  removeUserUnits,
  getAccessGroups,
  getFaculties,
  getProgrammesUnfiltered,
}) => {
  const { getTextIn } = useLanguage()
  const { userId: currentUserId, isAdmin } = useGetAuthorizedUserQuery()
  const showAsUser = useShowAsUser()

  useEffect(() => {
    if (elementdetails.length === 0) getElementDetails()
    if (accessGroups.data.length === 0) getAccessGroups()
    if (faculties.length === 0) getFaculties()
    if (Object.keys(associations).length === 0 && !pending) {
      getProgrammesUnfiltered()
    }
  }, [])

  const removeAccess = (uid, unit) => () => removeUserUnits(uid, [unit])

  const renderUnitList = (usersElementdetailCodes, elementdetails, user) => {
    if (!usersElementdetailCodes) return null
    const nameInLanguage = element => getTextIn(element.name)
    const elementDetailCodesAvailable = new Set(elementdetails.map(({ code }) => code))
    const usersElementdetailCodesAvailable = usersElementdetailCodes.filter(obj =>
      elementDetailCodesAvailable.has(obj.elementDetailCode)
    )
    usersElementdetailCodesAvailable.sort()
    return (
      <List divided>
        {usersElementdetailCodesAvailable.length > 0 &&
          usersElementdetailCodesAvailable.map(({ elementDetailCode: code }) => {
            const element = elementdetails.find(e => e.code === code)
            return (
              <List.Item key={code}>
                <List.Content floated="right">
                  <Button
                    data-cy="remove-access"
                    basic
                    negative
                    floated="right"
                    onClick={removeAccess(user.id, code)}
                    content="Remove"
                    size="tiny"
                  />
                </List.Content>
                <List.Content>
                  {element && element.type === 30 ? <Icon name="minus" /> : null}{' '}
                  {`${nameInLanguage(element)} (${code})`}
                </List.Content>
              </List.Item>
            )
          })}
      </List>
    )
  }

  const renderUserInfoCard = () => (
    <Card fluid>
      <Card.Content>
        <Card.Header>
          {isAdmin && user.username !== currentUserId && user.is_enabled && (
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
        <Card.Description>
          {`Access to oodikone: ${user.is_enabled ? 'En' : 'Dis'}abled`} <br />
        </Card.Description>
      </Card.Content>
    </Card>
  )

  const renderAccessRights = () => (
    <Card fluid>
      <Card.Content>
        <Card.Header content="Access rights" />
        <Card.Description>
          {user.accessgroup.map(ag => ag.group_code).includes('admin') ? (
            <p
              style={{
                fontSize: '34px',
                fontFamily: 'Comic Sans',
                color: 'darkred',
                border: '1px',
              }}
            >
              Admin access!
            </p>
          ) : null}
          {renderUnitList(user.programme, elementdetails, user)}
          <Header content="Faculties" />
          <Dropdown
            placeholder="Select faculties"
            fluid
            selection
            multiple
            value={user.faculty.map(f => f.faculty_code)}
            options={sortBy(
              faculties.map(f => ({
                key: f.code,
                text: getTextIn(f.name),
                description: f.code,
                value: f.code,
              })),
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

  if (!accessGroups) {
    return null
  }

  return (
    <div>
      <Button icon="arrow circle left" content="Back" onClick={goBack} />
      <Divider />
      <Card.Group>
        {renderUserInfoCard()}
        <Card fluid>
          <Card.Content>
            <Card.Header content="Add study programme access rights" />
            <Divider />
            <AccessRights uid={user.id} rights={user.elementdetails} />
          </Card.Content>
        </Card>
        <Card fluid>
          <Card.Content>
            <Card.Header content="Add access group rights" />
            <Divider />
            <AccessGroups user={user} />
          </Card.Content>
        </Card>
        {renderAccessRights()}
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
  )
}

const mapStateToProps = state => ({
  units: state.units.data,
  faculties: state.faculties.data,
  associations: state.populationProgrammesUnfiltered.data,
  pending: !!state.populationProgrammesUnfiltered.pending,
  elementdetails: state.elementdetails.data,
  accessGroups: state.accessGroups,
})

export default connect(mapStateToProps, {
  removeUserUnits,
  setFaculties,
  getProgrammesUnfiltered,
  getAccessGroups,
  getFaculties,
  getElementDetails,
})(withRouter(UserPage))
