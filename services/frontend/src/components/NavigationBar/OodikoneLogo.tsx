import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { useLocation } from 'react-router'
import { Link } from '@/components/common/Link'
import { isDev, prodBasePath } from '@/conf'

const DevChip = () => {
  const location = useLocation()
  const prodUrl = `${prodBasePath}${location.pathname}${location.search}${location.hash}`

  return (
    <Tooltip title="Open in production">
      <IconButton
        onClick={() => {
          window.open(prodUrl, '_blank', 'noopener,noreferrer')
        }}
      >
        <Chip color="error" label="dev" size="small" />
      </IconButton>
    </Tooltip>
  )
}

export const OodikoneLogo = () => {
  return (
    <Stack alignItems="center" direction="row" gap={1}>
      <Typography
        component={Link}
        noWrap
        sx={{
          color: 'inherit',
          fontWeight: 'bold',
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
      {isDev ? <DevChip /> : null}
    </Stack>
  )
}
