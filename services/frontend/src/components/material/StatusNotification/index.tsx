import { Alert, Snackbar } from '@mui/material'

/**
 * A temporary notification message to give feedback on the status of an action.
 *
 * @param message - The message to display to the user.
 * @param onClose - The function to call when the notification is closed.
 * @param open - Whether the notification is open or not.
 * @param severity - The severity of the notification. Changes the color and icon of the notification.
 */
export const StatusNotification = ({
  message,
  onClose,
  open,
  severity,
}: {
  message: string
  onClose: () => void
  open: boolean
  severity: 'success' | 'info' | 'warning' | 'error'
}) => {
  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      autoHideDuration={10000}
      onClose={onClose}
      open={open}
    >
      <Alert onClose={onClose} severity={severity}>
        {message}
      </Alert>
    </Snackbar>
  )
}
