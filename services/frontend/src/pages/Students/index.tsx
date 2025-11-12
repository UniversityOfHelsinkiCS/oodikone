import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import { Outlet } from 'react-router'

import { PageTitle } from '@/components/common/PageTitle'
import { StudentNameVisibilityToggle } from '@/components/material/StudentNameVisibilityToggle'
import { useTitle } from '@/hooks/title'

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
