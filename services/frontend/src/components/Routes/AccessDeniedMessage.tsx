import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'

import { PageTitle } from '@/components/common/PageTitle'
import { useTitle } from '@/hooks/title'

export const AccessDeniedMessage = () => {
  useTitle('Access denied')

  return (
    <Container maxWidth="md">
      <PageTitle title="Access denied" />
      <Alert
        icon={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <DoNotDisturbIcon />
          </Box>
        }
        severity="error"
        variant="outlined"
      >
        <AlertTitle>Access denied</AlertTitle>
        You don't currently have permission to view this page. If you believe this is a mistake, please contact{' '}
        <Link href="mailto:oodikone@helsinki.fi" underline="hover">
          oodikone@helsinki.fi
        </Link>
        .
      </Alert>
    </Container>
  )
}
