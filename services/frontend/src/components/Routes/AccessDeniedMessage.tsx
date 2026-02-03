import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'

import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { useTitle } from '@/hooks/title'
import { DoNotDisturbIcon } from '@/theme'

export const AccessDeniedMessage = () => {
  useTitle('Access denied')

  return (
    <PageLayout maxWidth="lg">
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
    </PageLayout>
  )
}
