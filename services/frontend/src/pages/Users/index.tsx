import { Container } from '@mui/material'
import { useEffect } from 'react'
import { useParams } from 'react-router'

import { isDefaultServiceProvider } from '@/common'
import { PageTitle } from '@/components/material/PageTitle'
import { useTitle } from '@/hooks/title'
import { useLazyGetAllUsersQuery } from '@/redux/users'
import { NewUserSection } from './NewUserSection'
import { UserPage } from './UserPage'
import { UsersTable } from './UsersTable'

export const Users = () => {
  useTitle('Users')
  const { userid } = useParams()
  const [getAllUsersQuery, { data: users = [], isLoading, isError }] = useLazyGetAllUsersQuery()

  const onAddUser = () => {
    void getAllUsersQuery()
  }

  useEffect(() => {
    if (!userid) {
      void getAllUsersQuery()
    }
  }, [userid])

  return (
    <Container maxWidth="lg">
      <PageTitle title="Users" />
      {!userid && !isDefaultServiceProvider() && <NewUserSection onAddUser={onAddUser} />}
      {userid ? (
        <UserPage />
      ) : (
        <UsersTable getAllUsersQuery={getAllUsersQuery} isError={isError} isLoading={isLoading} users={users} />
      )}
    </Container>
  )
}
