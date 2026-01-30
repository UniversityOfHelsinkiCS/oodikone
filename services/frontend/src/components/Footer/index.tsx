import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { ExternalLink } from '@/components/common/ExternalLink'
import { ToskaLogo } from '@/components/Footer/ToskaLogo'
import { builtAt, dataProtectionUrl, licenseUrl, sentryRelease, sourceCodeUrl } from '@/conf'
import { DateFormat } from '@/constants/date'
import { reformatDate } from '@/util/timeAndDate'

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
      <Stack
        direction={{ xs: 'column-reverse', sm: 'row' }}
        sx={{
          alignItems: 'center',
          spacing: 3,
          justifyContent: 'space-between',
          maxWidth: 'xl',
          px: 3,
          mx: 'auto',
        }}
      >
        <Stack direction="row" gap={3}>
          <Stack>
            <Typography variant="subtitle1">Oodikone</Typography>
            <ExternalLink href={dataProtectionUrl} text="Data protection" />
            <ExternalLink href={sourceCodeUrl} text="Source code" />
            <ExternalLink href={licenseUrl} text="License" />
          </Stack>
          <Stack>
            <Typography variant="subtitle1">Build</Typography>
            <ExternalLink href="/changelog" text="Changelog" />
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
    </Box>
  )
}
