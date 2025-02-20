import { Alert, Box, CircularProgress, Container, Stack } from '@mui/material'

import { useTitle } from '@/hooks/title'
import { useGetUserQuery } from '@/redux/users'
import { InfoCard } from './InfoCard'
import { MissingIdAlert } from './MissingIdAlert'
import { RolesCard } from './RolesCard'
import { StudyProgrammeRightsCard } from './StudyProgrammeRightsCard'

export const UserPage = ({ userId }: { userId: string }) => {
  const { data: user, isLoading, isError } = useGetUserQuery(userId)

  useTitle(user?.name ? `${user.name} - Users` : 'Users')

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <CircularProgress />
      </Box>
    )
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
        <RolesCard user={user} />
        <StudyProgrammeRightsCard user={user} />
      </Stack>
    </Container>
  )
}
