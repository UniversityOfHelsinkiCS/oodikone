import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'

import { PageTitle } from '@/components/common/PageTitle'
import { AccessDeniedMessage } from '@/components/Routes/AccessDeniedMessage'
import { GetFacultiesResponse } from '@/types/api/faculty'
import { FacultyCard } from './FacultyCard'

export const FacultyList = ({ faculties }: { faculties: GetFacultiesResponse[] }) => {
  if (faculties == null) {
    return <AccessDeniedMessage />
  }

  return (
    <Container maxWidth="sm">
      <PageTitle title="Faculties" />
      <Stack gap={2}>
        {faculties.map(faculty => (
          <FacultyCard faculty={faculty} key={faculty.id} />
        ))}
      </Stack>
    </Container>
  )
}
