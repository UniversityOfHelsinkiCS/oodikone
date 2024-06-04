import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Header } from 'semantic-ui-react'

import { useTitle } from '@/common/hooks'
import { useLazyGetAllUsersQuery } from '@/redux/users'
import { NewUserSection } from './NewUserSection'
import { UserPage } from './UserPage'
import { UserSearchList } from './UserSearchList'

export const Users = () => {
  useTitle('Users')
  const { userid } = useParams()
  const [users, setUsers] = useState([])
  const [getAllUsersQuery, { data: usersFromApi = [], isLoading, isError }] = useLazyGetAllUsersQuery()
  // TODO: After OOD-9 merged this should be removed and used the real one
  const isDefaultProvider = () => {
    return false
  }

  const forceUpdate = () => {
    getAllUsersQuery()
    setUsers(usersFromApi)
  }

  useEffect(() => {
    if (!userid) {
      getAllUsersQuery()
      setUsers(usersFromApi)
    }
  }, [userid])

  return (
    <div className="segmentContainer" style={{ marginBottom: '10px' }}>
      <Header className="segmentTitle" size="large">
        Oodikone users
      </Header>
      {!userid && !isDefaultProvider() && <NewUserSection onAddUser={forceUpdate} />}
      {userid ? <UserPage /> : <UserSearchList isError={isError} isLoading={isLoading} users={users} />}
    </div>
  )
}
