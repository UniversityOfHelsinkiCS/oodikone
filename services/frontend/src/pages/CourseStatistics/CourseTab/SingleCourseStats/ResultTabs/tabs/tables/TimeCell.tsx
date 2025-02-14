import { NorthEast as NorthEastIcon } from '@mui/icons-material'
import { IconButton, Stack, Typography } from '@mui/material'
import { Link } from 'react-router'

import { isDefaultServiceProvider } from '@/common'

export const TimeCell = ({
  href,
  isEmptyRow,
  name,
  userHasAccessToAllStats,
}: {
  href: string
  isEmptyRow: boolean
  name: string
  userHasAccessToAllStats: boolean
}) => {
  return (
    <Stack alignItems="center" direction="row" gap={1} justifyContent="space-between">
      <Typography variant="body2">
        {name}
        {name === 'Total' && !userHasAccessToAllStats && <strong> *</strong>}
      </Typography>
      {name !== 'Total' && userHasAccessToAllStats && isDefaultServiceProvider() && (
        <IconButton
          color="primary"
          component={Link}
          disabled={isEmptyRow}
          size="small"
          sx={{ padding: 0 }}
          title={`Course population for ${name}`}
          to={href}
        >
          <NorthEastIcon fontSize="small" />
        </IconButton>
      )}
    </Stack>
  )
}
