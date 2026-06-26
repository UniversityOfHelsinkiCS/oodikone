import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { useLocation } from 'react-router'
import { Link } from '@/components/common/Link'
import { isDev, prodBasePath } from '@/conf'
import { useGetAuthorizedUserQuery } from '@/redux/auth'

const DevChip = ({ prod }: { prod?: true }) => {
  const location = useLocation()
  const url = `${prod ? 'http://localhost:3000' : prodBasePath}${location.pathname}${location.search}${location.hash}`

  return (
    <Tooltip title={`Open in ${prod ? 'development (visible for admins)' : 'production'}`}>
      <IconButton
        onClick={() => {
          window.open(url, '_blank', 'noopener,noreferrer')
        }}
      >
        <Chip color={prod ? 'success' : 'error'} label={prod ? 'prod' : 'dev'} size="small" />
      </IconButton>
    </Tooltip>
  )
}

export const OodikoneLogo = () => {
  const { isAdmin } = useGetAuthorizedUserQuery()
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
      {isDev ? <DevChip /> : isAdmin ? <DevChip prod /> : null}
    </Stack>
  )
}
