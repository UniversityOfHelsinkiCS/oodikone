import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory, useParams } from 'react-router-dom'
import { Radio, Icon, Header, Segment, Loader, Popup } from 'semantic-ui-react'

import { getUsers } from 'redux/users'
import { getUnits } from 'redux/units'
import UserPageNew from './UserPage'
import UserSearchList from './UserSearchList'
import { useToggle, useTitle } from '../../common/hooks'

const Users = () => {
  useTitle('Users')
  const dispatch = useDispatch()
  const history = useHistory()
  const [enabledOnly, toggleEnabledOnly] = useToggle(true)
  const [popupTimeout, setPopupTimeout] = useState(null)
  const [popupOpen, setPopupOpen] = useState(false)
  const { data: units } = useSelector(({ units }) => units)
  const { data: users, pending } = useSelector(({ users }) => users)
  const { userid } = useParams()

  useEffect(() => {
    if (units.length === 0) dispatch(getUnits())
    if (users.length === 0) dispatch(getUsers())

    return () => {
      clearTimeout(popupTimeout)
    }
  }, [])

  const openUsersPage = () => {
    history.push('/users')
  }

  const copyEmailsToClippoard = () => {
    const clipboardString = users
      .filter(u => u.is_enabled && u.email)
      .map(u => u.email)
      .join('; ')
    navigator.clipboard.writeText(clipboardString)
  }

  const renderUserPage = userid => {
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

  const isLoading = pending === undefined || pending === true
  const error = users.error || false
  const sortedUsers = [...users].sort((a, b) => a.full_name.localeCompare(b.full_name))

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
      <Segment loading={isLoading} className="contentSegment">
        {!userid ? (
          <UserSearchList enabledOnly={enabledOnly} users={sortedUsers} error={error} />
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

export default Users
