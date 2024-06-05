import { useEffect } from 'react'
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
  const [getAllUsersQuery, { data: users = [], isLoading, isError }] = useLazyGetAllUsersQuery()
  // TODO: After OOD-9 merged this should be removed and used the real one
  // for now, set to false in order to activate the feature of adding new users from Sisu
  const isDefaultProvider = () => {
    return true
  }

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
      {!userid && !isDefaultProvider() && <NewUserSection onAddUser={onAddUser} />}
      {userid ? <UserPage /> : <UserSearchList isError={isError} isLoading={isLoading} users={users} />}
    </div>
  )
}
