import React from 'react'
import { useParams } from 'react-router-dom'
import { Header } from 'semantic-ui-react'

import { useTitle } from 'common/hooks'
import { UserPage } from './UserPage'
import { UserSearchList } from './UserSearchList'

export const Users = () => {
  useTitle('Users')
  const { userid } = useParams()

  return (
    <div className="segmentContainer" style={{ marginBottom: '10px' }}>
      <Header className="segmentTitle" size="large">
        Oodikone users
      </Header>
      {userid ? <UserPage /> : <UserSearchList />}
    </div>
  )
}
