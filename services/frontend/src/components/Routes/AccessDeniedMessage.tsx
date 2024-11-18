import { DoNotDisturb } from '@mui/icons-material'
import { Alert, AlertTitle, Box, Container, Link } from '@mui/material'

import { useTitle } from '@/common/hooks'
import { PageTitle } from '../material/PageTitle'

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
            <DoNotDisturb />
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
