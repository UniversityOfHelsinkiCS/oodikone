import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { Radio, Icon, Header, Segment, Loader, Popup } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getUsers } from '../../redux/users'
import { getUnits } from '../../redux/units'
import { getElementDetails } from '../../redux/elementdetails'
import { makeSortUsers } from '../../selectors/users'
import { copyToClipboard } from '../../common'
import UserPageNew from '../UserPage'
import UserSearchList from './UserSearchList'

const EnableUsers = props => {
  const [enabledOnly, setEnabledOnly] = useState(true)
  const [popupTimeout, setPopupTimeout] = useState(null)
  const [popupOpen, setPopupOpen] = useState(false)

  useEffect(() => {
    if (props.elementdetails.length === 0) props.getElementDetails()
    if (props.units.length === 0) props.getUnits()
    if (props.users.length === 0) props.getUsers()
    document.title = 'Users - Oodikone'

    return () => {
      clearTimeout(popupTimeout)
    }
  }, [])

  const toggleEnabledOnly = () => {
    if (props.enabledOnly) props.getUsers()
    setEnabledOnly(!enabledOnly)
  }

  const openUsersPage = () => {
    const { history } = props
    history.push('/users')
  }

  const copyEmailsToClippoard = () => {
    const clipboardString = props.users
      .filter(u => u.is_enabled && u.email)
      .map(u => u.email)
      .join('; ')
    copyToClipboard(clipboardString)
  }

  const renderUserPage = userid => {
    const { users } = props
    const user = users.find(u => u.id === userid)
    return !user ? <Loader active /> : <UserPageNew userid={userid} user={user} goBack={openUsersPage} />
  }

  const handlePopupOpen = () => {
    setPopupOpen(true)
    setPopupTimeout(
      setTimeout(() => {
        setPopupOpen(false)
      }, 1500)
    )
  }

  const handlePopupClose = () => {
    setPopupOpen(false)
    setPopupTimeout(null)
  }

  const { match, pending, users, error, elementdetails } = props
  const { userid } = match.params
  return (
    <div style={{ marginBottom: '10px' }} className="segmentContainer">
      <Header className="segmentTitle" size="large">
        Oodikone users
      </Header>
      <Radio
        label={`Showing ${enabledOnly ? 'only enabled' : 'all'} users`}
        toggle
        onClick={() => toggleEnabledOnly()}
      />
      <Segment loading={pending} className="contentSegment">
        {!userid ? (
          <UserSearchList enabledOnly={enabledOnly} users={users} error={error} elementdetails={elementdetails} />
        ) : (
          renderUserPage(userid)
        )}
      </Segment>
      <Popup
        trigger={<Icon link name="envelope" onClick={copyEmailsToClippoard} style={{ float: 'right' }} />}
        content="Copied email(s)!"
        on="click"
        onOpen={handlePopupOpen}
        onClose={handlePopupClose}
        open={popupOpen}
      />
    </div>
  )
}

const sortUsers = makeSortUsers()

const mapStateToProps = ({ users, units, elementdetails }) => ({
  units: units.data,
  elementdetails: elementdetails.data,
  enabledOnly: users.enabledOnly,
  users: sortUsers(users),
  pending: typeof users.pending === 'boolean' ? users.pending : true,
  error: users.error || false,
})

export default withRouter(
  connect(mapStateToProps, {
    getUsers,
    getUnits,
    getElementDetails,
  })(EnableUsers)
)
