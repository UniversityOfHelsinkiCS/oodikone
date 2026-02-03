import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { Link } from '@/components/common/Link'
import { useSisUrl } from '@/hooks/useSisUrl'
import { PersonIcon } from '@/theme'
import { ExternalLink } from './ExternalLink'

export const StudentInfoItem = ({ sisPersonId, studentNumber }: { sisPersonId: string; studentNumber: string }) => {
  const usableSisUrl = useSisUrl()

  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography component="span" sx={{ alignContent: 'center', padding: '0 0.25em' }} variant="body2">
        {studentNumber}
      </Typography>
      <IconButton component={Link} target="_blank" to={`/students/${studentNumber}`}>
        <PersonIcon color="primary" fontSize="small" />
      </IconButton>
      <ExternalLink href={`${usableSisUrl}/tutor/role/staff/student/${sisPersonId}/basic/basic-info`} text="Sisu" />
    </Stack>
  )
}
