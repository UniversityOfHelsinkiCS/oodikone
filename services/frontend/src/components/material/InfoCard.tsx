import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export const HelpInfoCard = ({ title, body }: { title: string; body: string }) => (
  <Box sx={{ maxWidth: '80%', mx: 'auto', my: 1 }}>
    <Alert
      icon={<HelpOutlineIcon sx={{ fontSize: '2.5em', alignSelf: 'center', mx: 1.5 }} />}
      severity="info"
      sx={{ fontSize: '1.2em', p: 2 }}
    >
      <AlertTitle>
        <Typography component="span" variant="h6">
          {title}
        </Typography>
      </AlertTitle>
      {body}
    </Alert>
  </Box>
)
