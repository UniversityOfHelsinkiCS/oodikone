import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { isDefaultServiceProvider } from '@/common'
import { ExternalLink } from '@/components/common/ExternalLink'
import { Link } from '@/components/common/Link'
import { builtAt, dataProtectionUrl, licenseUrl, sentryRelease, sourceCodeUrl } from '@/conf'
import { DateFormat } from '@/constants/date'
import { reformatDate } from '@/util/timeAndDate'
import { ToskaLogo } from './ToskaLogo'

export const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        bottom: 0,
        left: 0,
        position: 'relative',
        my: 1,
      }}
    >
      <Divider sx={{ my: 1 }} />
      <Container maxWidth="lg">
        <Stack
          alignItems={{ md: 'center' }}
          direction={{ sm: 'column', md: 'row' }}
          gap={3}
          justifyContent="space-between"
        >
          <Stack direction={{ sm: 'column', md: 'row' }} gap={{ xs: 3, md: 4 }}>
            <Stack>
              <Typography variant="subtitle1">Oodikone</Typography>
              {isDefaultServiceProvider() && <ExternalLink href={dataProtectionUrl} text="Data protection" />}
              <ExternalLink href={sourceCodeUrl} text="Source code" />
              <ExternalLink href={licenseUrl} text="License" />
            </Stack>
            <Stack>
              <Typography variant="subtitle1">Build</Typography>
              <Link to="/changelog">Changelog</Link>
              <Typography color="text.secondary" variant="body2">
                Updated {reformatDate(builtAt || new Date().toISOString(), DateFormat.DISPLAY_DATETIME)}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Version {sentryRelease || 'dev'}
              </Typography>
            </Stack>
          </Stack>
          <ToskaLogo />
        </Stack>
      </Container>
    </Box>
  )
}
