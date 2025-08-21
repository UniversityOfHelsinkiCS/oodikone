import PersonIcon from '@mui/icons-material/Person'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { Link } from 'react-router'

import { sisUrl } from '@/conf'
import { ExternalLink } from './ExternalLink'

export const StudentInfoItem = ({ sisPersonId, studentNumber }: { sisPersonId: string; studentNumber: string }) => (
  <Stack direction="row" justifyContent="space-between">
    <Typography component="span" sx={{ alignContent: 'center', padding: '0 0.25em' }} variant="body2">
      {studentNumber}
    </Typography>
    <IconButton component={Link} target="_blank" to={`/students/${studentNumber}`}>
      <PersonIcon color="primary" fontSize="small" />
    </IconButton>
    <ExternalLink href={`${sisUrl}/tutor/role/staff/student/${sisPersonId}/basic/basic-info`} text="Sisu" />
  </Stack>
)
