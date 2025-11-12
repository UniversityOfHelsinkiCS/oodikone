import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { Link } from '@/components/common/Link'
import { isDev } from '@/conf'

export const OodikoneLogo = () => {
  return (
    <Stack alignItems="center" direction="row" gap={1}>
      <Typography
        component={Link}
        noWrap
        sx={{
          color: 'inherit',
          fontWeight: 700,
          letterSpacing: '.1rem',
          '&:hover': {
            color: 'inherit',
          },
        }}
        to="/"
        variant="h6"
      >
        oodikone
      </Typography>
      {isDev ? <Chip color="error" label="dev" size="small" /> : null}
    </Stack>
  )
}
