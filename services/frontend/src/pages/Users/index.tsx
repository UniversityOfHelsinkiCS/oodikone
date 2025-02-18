import { useEffect } from 'react'
import { useParams } from 'react-router'
import { Header } from 'semantic-ui-react'

import { isDefaultServiceProvider } from '@/common'
import { useTitle } from '@/hooks/title'
import { useLazyGetAllUsersQuery } from '@/redux/users'
import { NewUserSection } from './NewUserSection'
import { UserPage } from './UserPage'
import { UserSearchList } from './UserSearchList'

export const Users = () => {
  useTitle('Users')
  const { userid } = useParams()
  const [getAllUsersQuery, { data: users = [], isLoading, isError }] = useLazyGetAllUsersQuery()

  const onAddUser = () => {
    getAllUsersQuery()
  }

  useEffect(() => {
    if (!userid) {
      getAllUsersQuery()
    }
  }, [userid])

  return (
    <div className="segmentContainer" style={{ marginBottom: '10px' }}>
      <Header className="segmentTitle" size="large">
        Oodikone users
      </Header>
      {!userid && !isDefaultServiceProvider() && <NewUserSection onAddUser={onAddUser} />}
      {userid ? (
        <UserPage />
      ) : (
        <UserSearchList getAllUsersQuery={getAllUsersQuery} isError={isError} isLoading={isLoading} users={users} />
      )}
    </div>
  )
}
