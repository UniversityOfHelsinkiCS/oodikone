import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useState } from 'react'

export const RightsNotification = ({ discardedStudentNumbers }) => {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return null
  }

  return (
    <Alert data-cy="rights-notification" severity="error" variant="outlined">
      <Typography variant="h6">Invalid or forbidden student numbers</Typography>
      <Typography>
        The following students information could not be displayed. This could be either because they do not exist, or
        you do not have the right to view their information.
      </Typography>
      <ul>
        {[...new Set(discardedStudentNumbers)].map(num => (
          <li key={num}>{num}</li>
        ))}
      </ul>
      <Button color="error" onClick={() => setVisible(false)} variant="outlined">
        Hide notification
      </Button>
    </Alert>
  )
}
