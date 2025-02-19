import { Email as EmailIcon } from '@mui/icons-material'
import { Button } from '@mui/material'

export const NotifyButton = () => {
  return (
    <Button
      color="primary"
      // onClick={() => // implement}
      size="small"
      startIcon={<EmailIcon />}
      variant="outlined"
    >
      Notify
    </Button>
  )
}
