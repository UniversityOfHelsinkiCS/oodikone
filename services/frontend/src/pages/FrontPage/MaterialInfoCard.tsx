import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'

import { NavLink } from 'react-router'

import { isDefaultServiceProvider } from '@/common'

/**
 * A temporary notification card about the new UI.
 * Can be removed when most of the work is done.
 */
export const MaterialInfoCard = () => {
  return (
    <Alert
      icon={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <InfoOutlinedIcon />
        </Box>
      }
      severity="info"
      variant="outlined"
    >
      <AlertTitle>New user interface</AlertTitle>
      Oodikone is getting a new look! We are gradually updating each view to the new design.
      {isDefaultServiceProvider() && (
        <>
          {' '}
          <Link component={NavLink} to="/feedback">
            Let us know
          </Link>{' '}
          if you have any feedback or suggestions.
        </>
      )}
    </Alert>
  )
}
