import { DoNotDisturb } from '@mui/icons-material'
import { Container, Box, Link, Paper, Typography } from '@mui/material'

import { useTitle } from '@/common/hooks'

export const AccessDeniedMessage = () => {
  useTitle('Access denied')

  return (
    <Container maxWidth="md" sx={{ paddingTop: 2 }}>
      <Paper
        sx={{
          alignItems: 'center',
          bgcolor: 'error.light',
          color: 'common.white',
          display: 'flex',
          padding: 2,
        }}
      >
        <DoNotDisturb fontSize="large" sx={{ marginRight: 2 }} />
        <Box>
          <Typography component="h2" variant="h6">
            Access denied
          </Typography>
          <Typography variant="body1">
            You don't currently have permission to view this page. If you believe this is a mistake, please contact{' '}
            <Link color="inherit" href="mailto:oodikone@helsinki.fi" underline="hover">
              oodikone@helsinki.fi
            </Link>
            .
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}
