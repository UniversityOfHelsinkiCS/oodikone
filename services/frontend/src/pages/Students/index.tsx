import { Container, Stack } from '@mui/material'
import { Outlet } from 'react-router'

import { useTitle } from '@/common/hooks'
import { PageTitle } from '@/components/material/PageTitle'
import { StudentNameVisibilityToggle } from '@/components/StudentNameVisibilityToggle'

export const Students = () => {
  useTitle('Student statistics')

  return (
    <Container maxWidth="lg">
      <PageTitle title="Student statistics" />
      <Stack alignItems="center" spacing={2}>
        <StudentNameVisibilityToggle />
        <Outlet />
      </Stack>
    </Container>
  )
}
