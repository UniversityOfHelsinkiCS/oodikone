import Card from '@mui/material/Card'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { Link } from 'react-router'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { GetFacultiesResponse } from '@/types/api/faculty'

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
