import { Box, Container, Divider, Stack, Typography } from '@mui/material'

import { isDefaultServiceProvider } from '@/common'
import { builtAt, dataProtectionUrl, licenseUrl, sentryRelease, sourceCodeUrl } from '@/conf'
import { DISPLAY_DATETIME_FORMAT } from '@/constants/date'
import { reformatDate } from '@/util/timeAndDate'
import { ExternalLink } from './ExternalLink'
import { InternalLink } from './InternalLink'
import { ToskaLogo } from './ToskaLogo'

export const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        bottom: 0,
        left: 0,
        position: 'relative',
        py: 3,
      }}
    >
      <Divider sx={{ my: 2 }} />
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
              <InternalLink href="/changelog" text="Changelog" />
              <Typography color="text.secondary" variant="body2">
                Updated {reformatDate(builtAt || new Date().toISOString(), DISPLAY_DATETIME_FORMAT)}
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
