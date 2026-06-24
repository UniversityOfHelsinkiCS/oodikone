import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

import { PageLayout } from '@/components/common/PageLayout'
import { Loading } from '@/components/Loading'
import { useTitle } from '@/hooks/title'
import { IamGroupsCard } from '@/pages/Users/UserPage/IamGroupsCard'
import { InfoCard } from '@/pages/Users/UserPage/InfoCard'
import { MissingIdAlert } from '@/pages/Users/UserPage/MissingIdAlert'
import { RolesCard } from '@/pages/Users/UserPage/RolesCard'
import { StudyProgrammeRightsCard } from '@/pages/Users/UserPage/StudyProgrammeRightsCard'
import { useGetUserQuery } from '@/redux/users'

export const UserPage = ({ userId }: { userId: string }) => {
  const { data: user, isLoading, isError } = useGetUserQuery(userId)

  useTitle(user?.name ? `${user.name} - Users` : 'Users')

  if (isLoading) {
    return <Loading />
  }

  if (!user || isError) {
    return (
      <PageLayout maxWidth="lg">
        <Alert severity="error" variant="outlined">
          User not found
        </Alert>
      </PageLayout>
    )
  }

  return (
    <PageLayout maxWidth="lg">
      <Stack direction="column" gap={2}>
        <MissingIdAlert visible={!user.sisPersonId} />
        <InfoCard user={user} />
        <Box gap={2} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          <Box flex={1}>
            <IamGroupsCard user={user} />
          </Box>
          <Box flex={2}>
            <RolesCard user={user} />
          </Box>
        </Box>
        <StudyProgrammeRightsCard user={user} />
      </Stack>
    </PageLayout>
  )
}
