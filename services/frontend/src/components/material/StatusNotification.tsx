import { Alert, Snackbar } from '@mui/material'
import { useStatusNotification } from './StatusNotificationContext'

export const StatusNotification = () => {
  const { message, severity, open, closeNotification } = useStatusNotification()

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      autoHideDuration={5000}
      onClose={closeNotification}
      open={open}
    >
      <Alert onClose={closeNotification} severity={severity}>
        {message}
      </Alert>
    </Snackbar>
  )
}
