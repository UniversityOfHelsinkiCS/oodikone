import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'

import { isDefaultServiceProvider } from '@/common'
import { Loading } from '@/components/Loading'
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
        <Box gap={2} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          {isDefaultServiceProvider() && (
            <Box flex={1}>
              <IamGroupsCard user={user} />
            </Box>
          )}
          <Box flex={2}>
            <RolesCard user={user} />
          </Box>
        </Box>
        <StudyProgrammeRightsCard user={user} />
      </Stack>
    </Container>
  )
}
