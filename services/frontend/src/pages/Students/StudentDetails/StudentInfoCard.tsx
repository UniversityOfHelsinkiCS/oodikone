import RefreshIcon from '@mui/icons-material/Refresh'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { callApi } from '@/apiConnection'
import { ExternalLink } from '@/components/material/ExternalLink'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { sisUrl } from '@/conf'
import { DateFormat } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { reformatDate } from '@/util/timeAndDate'
import { EnrollmentAccordion } from './EnrollmentAccordion'

export const StudentInfoCard = ({ student }) => {
  const { visible: showName } = useStudentNameVisibility()
  const { isAdmin } = useGetAuthorizedUserQuery()
  const name = showName ? `${student.name}, ` : ''
  const email = showName && student.email ? `${student.email}` : ''

  const formattedTimestamp = reformatDate(
    student.updatedAt,
    isAdmin ? DateFormat.DISPLAY_DATE_DEV : DateFormat.DISPLAY_DATE
  )

  const updateStudent = async () => {
    await callApi('/updater/update/v2/customlist/students', 'post', [student.studentNumber])
  }

  return (
    <Card data-cy="student-info-card" variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="column">
            <Typography variant="h6">
              {name} {student.studentNumber}
            </Typography>
            <ExternalLink
              cypress="sisu-link"
              href={`${sisUrl}/tutor/role/staff/student/${student.sis_person_id}/basic/basic-info`}
              text="Sisu"
              variant="h6"
            />
            <Typography color="textSecondary">{email}</Typography>
          </Stack>
          <Stack alignItems="flex-start" direction="column" spacing={1}>
            <Box component="span">Credits: {student.credits ?? 0}</Box>
            <EnrollmentAccordion student={student} />
            Updated at {formattedTimestamp}
            {isAdmin && (
              <Button onClick={updateStudent} startIcon={<RefreshIcon />} sx={{ marginTop: 1 }} variant="outlined">
                Update student
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
