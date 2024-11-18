import { InfoOutlined } from '@mui/icons-material'
import { Alert, AlertTitle, Link } from '@mui/material'
import { NavLink } from 'react-router-dom'

/**
 * A temporary notification card about the new UI.
 * Can be removed when most of the work is done.
 */
export const MaterialInfoCard = () => {
  return (
    <Alert icon={<InfoOutlined />} severity="info" variant="outlined">
      <AlertTitle>New user interface</AlertTitle>
      Oodikone is getting a new look! We are gradually updating each view to the new design.{' '}
      <Link component={NavLink} to="/feedback">
        Let us know
      </Link>{' '}
      if you have any feedback or suggestions.
    </Alert>
  )
}
