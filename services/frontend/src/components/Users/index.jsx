import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory, useParams } from 'react-router-dom'
import { Icon, Header, Segment, Loader, Popup } from 'semantic-ui-react'

import { getUsers } from 'redux/users'
import { useTitle } from 'common/hooks'
import { ConnectedUserPage as UserPage } from './UserPage'
import { UserSearchList } from './UserSearchList'

export const Users = () => {
  useTitle('Users')
  const dispatch = useDispatch()
  const history = useHistory()
  const [popupTimeout, setPopupTimeout] = useState(null)
  const [popupOpen, setPopupOpen] = useState(false)
  const { data: users, pending } = useSelector(({ users }) => users)
  const { userid } = useParams()

  useEffect(() => {
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
      .filter(u => u.email)
      .map(u => u.email)
      .join('; ')
    navigator.clipboard.writeText(clipboardString)
  }

  const renderUserPage = userid => {
    const user = users.find(u => u.id === userid)
    return !user ? <Loader active /> : <UserPage user={user} goBack={openUsersPage} />
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

  if (users.error) return <h3>Something went wrong, please try refreshing the page.</h3>

  return (
    <div style={{ marginBottom: '10px' }} className="segmentContainer">
      <Header className="segmentTitle" size="large">
        Oodikone users
      </Header>
      <Segment loading={isLoading} className="contentSegment">
        {!userid ? <UserSearchList users={users} /> : renderUserPage(userid)}
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
