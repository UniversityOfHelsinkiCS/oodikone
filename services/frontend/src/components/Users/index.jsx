import React from 'react'
import { useParams } from 'react-router-dom'
import { Header } from 'semantic-ui-react'

import { useTitle } from 'common/hooks'
import { ConnectedUserPage as UserPage } from './UserPage'
import { UserSearchList } from './UserSearchList'

export const Users = () => {
  useTitle('Users')
  const { userid } = useParams()

  return (
    <div style={{ marginBottom: '10px' }} className="segmentContainer">
      <Header className="segmentTitle" size="large">
        Oodikone users
      </Header>
      {userid ? <UserPage /> : <UserSearchList />}
    </div>
  )
}
