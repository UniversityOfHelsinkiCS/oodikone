import { Person as PersonIcon } from '@mui/icons-material'
import { IconButton, Stack } from '@mui/material'
import { Link } from 'react-router'

import { sisUrl } from '@/conf'
import { ExternalLink } from './ExternalLink'

export const StudentInfoItem = ({ sisPersonId, studentNumber }: { sisPersonId: string; studentNumber: string }) => (
  <Stack direction="row" justifyContent="space-between">
    {studentNumber}
    <Stack direction="row" gap={1}>
      <IconButton component={Link} sx={{ padding: 0 }} target="_blank" to={`/students/${studentNumber}`}>
        <PersonIcon color="primary" fontSize="small" />
      </IconButton>
      <ExternalLink href={`${sisUrl}/tutor/role/staff/student/${sisPersonId}/basic/basic-info`} text="Sisu" />
    </Stack>
  </Stack>
)
