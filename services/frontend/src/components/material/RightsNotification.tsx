import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

import { useState } from 'react'

export const RightsNotification = ({ discardedStudentNumbers }: { discardedStudentNumbers: string[] }) => {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return null
  }

  return (
    <Alert data-cy="rights-notification" onClose={() => setVisible(false)} severity="error">
      <AlertTitle>Invalid or forbidden student numbers</AlertTitle>
      The information for the following students could not be displayed. This may be because the students do not exist
      or you do not have the necessary permissions to view their information:
      <ul>
        {[...new Set(discardedStudentNumbers)].sort().map(num => (
          <li key={num}>{num}</li>
        ))}
      </ul>
    </Alert>
  )
}
