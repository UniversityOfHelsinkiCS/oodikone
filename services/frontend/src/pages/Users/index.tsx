import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import { useEffect } from 'react'
import { useParams } from 'react-router'

import { isDefaultServiceProvider } from '@/common'
import { PageTitle } from '@/components/common/PageTitle'
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
  }, [userid, getAllUsersQuery])

  return (
    <Container maxWidth="xl">
      <PageTitle title="Users" />
      <Stack gap={2}>
        {!userid && !isDefaultServiceProvider() && <NewUserSection onAddUser={onAddUser} />}
        {userid ? (
          <UserPage userId={userid} />
        ) : (
          <UsersTable getAllUsersQuery={getAllUsersQuery} isError={isError} isLoading={isLoading} users={users} />
        )}
      </Stack>
    </Container>
  )
}
