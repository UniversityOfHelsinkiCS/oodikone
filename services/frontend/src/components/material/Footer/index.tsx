import { Box, Container, Divider, Stack, Typography } from '@mui/material'

import { images, isDefaultServiceProvider } from '@/common'
import { builtAt, dataProtectionUrl, licenseUrl, sourceCodeUrl } from '@/conf'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { reformatDate } from '@/util/timeAndDate'
import { ExternalLink } from './ExternalLink'
import { InternalLink } from './InternalLink'

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
        <Stack alignItems="center" direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between">
          <Stack direction="row" gap={4}>
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
                Last updated on {reformatDate(builtAt || new Date().toISOString(), DISPLAY_DATE_FORMAT)}
              </Typography>
            </Stack>
          </Stack>
          <Box>
            <Stack alignItems="center">
              <a href="https://toska.dev" rel="noopener noreferrer" target="_blank">
                <img
                  alt="Toska logo"
                  src={images.toskaLogo}
                  style={{
                    display: 'block',
                    height: 'auto',
                    width: '100px',
                  }}
                  title="Toska logo"
                />
              </a>
              <Typography color="text.secondary" variant="caption">
                Developed by Toska
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
