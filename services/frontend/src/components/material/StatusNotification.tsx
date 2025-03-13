import { Alert, Snackbar } from '@mui/material'
import { useStatusNotification } from './StatusNotificationContext'

export const StatusNotification = () => {
  const { message, severity, open, closeNotification } = useStatusNotification()

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={30000}
      onClose={closeNotification}
      open={open}
    >
      <Alert onClose={closeNotification} severity={severity} sx={{ bgcolor: 'background.paper' }} variant="outlined">
        {message}
      </Alert>
    </Snackbar>
  )
}
