import PersonIcon from '@mui/icons-material/Person'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'

import { Link } from 'react-router'

import { sisUrl, serviceProvider } from '@/conf'
import { ExternalLink } from './ExternalLink'

//@ts-expect-error since frontendRuntimeConfiguredSisUrl is defined in a separate, possibly mounted js-file
const usableSisUrl = serviceProvider === 'fd' ? frontendRuntimeConfiguredSisUrl : sisUrl

export const StudentInfoItem = ({ sisPersonId, studentNumber }: { sisPersonId: string; studentNumber: string }) => (
  <Stack direction="row" justifyContent="space-between">
    {studentNumber}
    <Stack direction="row" gap={1}>
      <IconButton component={Link} sx={{ padding: 0 }} target="_blank" to={`/students/${studentNumber}`}>
        <PersonIcon color="primary" fontSize="small" />
      </IconButton>
      <ExternalLink href={`${usableSisUrl}/tutor/role/staff/student/${sisPersonId}/basic/basic-info`} text="Sisu" />
    </Stack>
  </Stack>
)
