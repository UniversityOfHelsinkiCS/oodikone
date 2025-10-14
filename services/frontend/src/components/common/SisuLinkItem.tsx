import LaunchIcon from '@mui/icons-material/Launch'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

import { useSisUrl } from '@/hooks/useSisUrl'

interface SisuLinkItemProps {
  id: string
}

export const SisuLinkItem = ({ id }: SisuLinkItemProps) => {
  const usableSisUrl = useSisUrl()

  return (
    <Box data-cy="sisulink">
      <Link href={`${usableSisUrl}/tutor/role/staff/student/${id}/basic/basic-info`} target="_blank">
        <Typography sx={{ display: 'flex' }}>
          Sisu <LaunchIcon color="primary" />
        </Typography>
      </Link>
    </Box>
  )
}
