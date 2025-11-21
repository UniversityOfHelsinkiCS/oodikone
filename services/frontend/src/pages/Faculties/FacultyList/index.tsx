import Stack from '@mui/material/Stack'

import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { AccessDeniedMessage } from '@/components/Routes/AccessDeniedMessage'
import { GetFacultiesResponse } from '@/types/api/faculty'
import { FacultyCard } from './FacultyCard'

export const FacultyList = ({ faculties }: { faculties: GetFacultiesResponse[] }) => {
  if (faculties == null) {
    return <AccessDeniedMessage />
  }

  return (
    <PageLayout maxWidth="lg">
      <PageTitle title="Faculties" />
      <Stack gap={2}>
        {faculties.map(faculty => (
          <FacultyCard faculty={faculty} key={faculty.id} />
        ))}
      </Stack>
    </PageLayout>
  )
}
