import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { Email } from '@/types/api/users'

export const EmailPreview = ({ email, userEmail }: { email: Email; userEmail: string }) => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack gap={1}>
          <Stack alignItems="center" direction="row" flexWrap="wrap" gap={1}>
            <Typography fontWeight="bold" variant="body2">
              To
            </Typography>
            <Chip label={userEmail} size="small" />
          </Stack>
          <Stack alignItems="center" direction="row" flexWrap="wrap" gap={1}>
            <Typography fontWeight="bold" variant="body2">
              Subject
            </Typography>
            <Typography color="text.primary" variant="body1">
              {email.subject}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
      <CardContent sx={{ padding: 1 }}>
        <iframe
          height="320px"
          referrerPolicy="no-referrer"
          sandbox=""
          src={`data:text/html;base64,${btoa(email.html)}`}
          srcDoc={email.html}
          style={{
            border: 'none',
            width: '100%',
          }}
          title="User access email preview"
        />
      </CardContent>
    </Card>
  )
}
