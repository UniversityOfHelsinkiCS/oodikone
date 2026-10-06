import Stack from '@mui/material/Stack'
import { useParams } from 'react-router'

import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { useTitle } from '@/hooks/title'
import { UserPage } from '@/pages/Users/UserPage'
import { UsersTable } from '@/pages/Users/UsersTable'
import { useGetAllUsersQuery } from '@/redux/users'

export const Users = () => {
  useTitle('Users')
  const { userid } = useParams()
  const { data: users, isLoading } = useGetAllUsersQuery(undefined, { skip: !!userid })

  return (
    <PageLayout maxWidth="lg">
      <PageTitle title="Users" />
      <Stack gap={2}>
        {userid ? <UserPage userId={userid} /> : <UsersTable isLoading={isLoading} users={users} />}
      </Stack>
    </PageLayout>
  )
}
