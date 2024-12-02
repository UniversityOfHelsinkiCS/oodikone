import { Card, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { GetFacultiesResponse } from '@/shared/types/api/faculty'

export const FacultyCard = ({ faculty }: { faculty: GetFacultiesResponse }) => {
  const { getTextIn } = useLanguage()

  return (
    <Card sx={{ padding: 2 }} variant="outlined">
      <Stack alignItems="center" direction="row" justifyContent="space-between">
        <Typography component={Link} to={`/faculties/${faculty.id}`} variant="h6">
          {getTextIn(faculty.name)}
        </Typography>
        <Typography color="text.secondary" component="p" variant="body1">
          {faculty.code}
        </Typography>
      </Stack>
    </Card>
  )
}
