import Stack from '@mui/material/Stack'
import { useEffect } from 'react'
import { useParams } from 'react-router'

import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { useTitle } from '@/hooks/title'
import { UserPage } from '@/pages/Users/UserPage'
import { UsersTable } from '@/pages/Users/UsersTable'
import { useLazyGetAllUsersQuery } from '@/redux/users'

export const Users = () => {
  useTitle('Users')
  const { userid } = useParams()
  const [getAllUsersQuery, { data: users = [], isLoading, isError }] = useLazyGetAllUsersQuery()

  useEffect(() => {
    if (!userid) {
      void getAllUsersQuery()
    }
  }, [userid, getAllUsersQuery])

  return (
    <PageLayout maxWidth="lg">
      <PageTitle title="Users" />
      <Stack gap={2}>
        {userid ? (
          <UserPage userId={userid} />
        ) : (
          <UsersTable getAllUsersQuery={getAllUsersQuery} isError={isError} isLoading={isLoading} users={users} />
        )}
      </Stack>
    </PageLayout>
  )
}
