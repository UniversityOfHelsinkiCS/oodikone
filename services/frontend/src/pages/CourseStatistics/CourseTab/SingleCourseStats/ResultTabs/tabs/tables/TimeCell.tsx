import NorthEastIcon from '@mui/icons-material/NorthEast'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { isDefaultServiceProvider } from '@/common'
import { Link } from '@/components/common/Link'

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
      {name !== 'Total' && userHasAccessToAllStats && isDefaultServiceProvider() ? (
        <IconButton
          color="primary"
          component={Link}
          data-cy={`course-population-for-${name}`}
          disabled={isEmptyRow}
          size="small"
          sx={{ padding: 0 }}
          title={`Course population for ${name}`}
          to={href}
        >
          <NorthEastIcon fontSize="small" />
        </IconButton>
      ) : null}
    </Stack>
  )
}
