import Alert from '@mui/material/Alert'

export const MissingIdAlert = ({ visible }: { visible: boolean }) => {
  if (!visible) {
    return null
  }

  return (
    <Alert severity="warning" sx={{ width: '100%' }} variant="outlined">
      This user does not have a person id. All their roles and access rights might not be displayed.
    </Alert>
  )
}
