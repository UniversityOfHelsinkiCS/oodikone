import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Header } from 'semantic-ui-react'

import { isDefaultServiceProvider } from '@/common'
import { useTitle } from '@/common/hooks'
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
        Oodikone users and is default {isDefaultServiceProvider()}
      </Header>
      {!userid && !isDefaultServiceProvider() && <NewUserSection onAddUser={onAddUser} />}
      {userid ? <UserPage /> : <UserSearchList isError={isError} isLoading={isLoading} users={users} />}
    </div>
  )
}
