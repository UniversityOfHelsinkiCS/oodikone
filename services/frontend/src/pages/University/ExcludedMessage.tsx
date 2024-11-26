import { Alert, Typography } from '@mui/material'

export const ExcludedMessage = () => {
  return (
    <Alert severity="info" sx={{ marginBottom: 2 }} variant="outlined">
      <Typography component="p" variant="body2">
        Programme MH90_001 (Veterinary medicine bachelor + licentiate) is currently excluded.
      </Typography>
    </Alert>
  )
}
