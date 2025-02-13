import { NorthEast as NorthEastIcon } from '@mui/icons-material'
import { Stack } from '@mui/material'
import { Link } from 'react-router'

import { isDefaultServiceProvider } from '@/common'

export const TimeCell = ({
  href,
  name,
  userHasAccessToAllStats,
}: {
  href: string
  name: string
  userHasAccessToAllStats: boolean
}) => {
  return (
    <Stack alignItems="center" direction="row" gap={1}>
      {name}
      {name === 'Total' && !userHasAccessToAllStats && <strong>*</strong>}
      {name !== 'Total' && userHasAccessToAllStats && isDefaultServiceProvider() && (
        <Link title="Population statistics of all years" to={href}>
          <NorthEastIcon fontSize="small" />
        </Link>
      )}
    </Stack>
  )
}
