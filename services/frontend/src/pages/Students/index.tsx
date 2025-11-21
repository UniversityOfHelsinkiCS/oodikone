import Stack from '@mui/material/Stack'
import { Outlet } from 'react-router'

import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { StudentNameVisibilityToggle } from '@/components/common/StudentNameVisibilityToggle'
import { useTitle } from '@/hooks/title'

export const Students = () => {
  useTitle('Student statistics')

  return (
    <PageLayout maxWidth="lg">
      <PageTitle title="Student statistics" />
      <Stack alignItems="center" spacing={2}>
        <StudentNameVisibilityToggle />
        <Outlet />
      </Stack>
    </PageLayout>
  )
}
