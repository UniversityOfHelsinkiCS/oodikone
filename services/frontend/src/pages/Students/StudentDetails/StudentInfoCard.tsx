import { Refresh as RefreshIcon } from '@mui/icons-material'
import { Card, CardContent, Typography, Button, Stack } from '@mui/material'

import { callApi } from '@/apiConnection'
import { ExternalLink } from '@/components/material/Footer/ExternalLink'
import { useStudentNameVisibility } from '@/components/StudentNameVisibilityToggle'
import { DISPLAY_DATE_FORMAT, DISPLAY_DATE_FORMAT_DEV } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { reformatDate } from '@/util/timeAndDate'
import { EnrollmentAccordion } from './EnrollmentAccordion'

export const StudentInfoCard = ({ student }) => {
  const { visible: showName } = useStudentNameVisibility()
  const { isAdmin } = useGetAuthorizedUserQuery()
  const name = showName ? `${student.name}, ` : ''
  const email = showName && student.email ? `${student.email}` : ''

  const formattedTimestamp = reformatDate(student.updatedAt, isAdmin ? DISPLAY_DATE_FORMAT_DEV : DISPLAY_DATE_FORMAT)

  const updateStudent = async () => {
    await callApi('/updater/update/v2/customlist/students', 'post', [student.studentNumber])
  }

  return (
    <Card data-cy="student-info-card" variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Stack alignItems="flex-start">
            <Typography variant="h6">
              {name} {student.studentNumber}
            </Typography>
            <ExternalLink
              cypress="sisu-link"
              href={`https://sisu.helsinki.fi/tutor/role/staff/student/${student.sis_person_id}/basic/basic-info`}
              text="Sisu"
              variant="h6"
            />
            <Typography color="textSecondary">{email}</Typography>
          </Stack>
          <Stack alignItems="flex-start" spacing={1}>
            Credits: {student.credits ?? 0}
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
