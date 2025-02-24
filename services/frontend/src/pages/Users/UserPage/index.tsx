import { Alert, Box, Container, Stack } from '@mui/material'

import { Loading } from '@/components/material/Loading'
import { useTitle } from '@/hooks/title'
import { useGetUserQuery } from '@/redux/users'
import { IamGroupsCard } from './IamGroupsCard'
import { InfoCard } from './InfoCard'
import { MissingIdAlert } from './MissingIdAlert'
import { RolesCard } from './RolesCard'
import { StudyProgrammeRightsCard } from './StudyProgrammeRightsCard'

export const UserPage = ({ userId }: { userId: string }) => {
  const { data: user, isLoading, isError } = useGetUserQuery(userId)

  useTitle(user?.name ? `${user.name} - Users` : 'Users')

  if (isLoading) {
    return <Loading />
  }

  if (!user || isError) {
    return (
      <Container maxWidth="sm">
        <Alert severity="error" variant="outlined">
          User not found
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <Stack direction="column" gap={2}>
        <MissingIdAlert visible={!user.sisPersonId} />
        <InfoCard user={user} />
        <Box display="flex" gap={2}>
          <Box flex={1}>
            <IamGroupsCard user={user} />
          </Box>
          <Box flex={2}>
            <RolesCard user={user} />
          </Box>
        </Box>
        <StudyProgrammeRightsCard user={user} />
      </Stack>
    </Container>
  )
}
