import { Typography } from '@mui/material'

export const StatusMessage = ({ isError, isLoading }: { isError: boolean; isLoading: boolean }) => {
  if (isError) {
    return (
      <Typography color="error" variant="body1">
        Failed to load users, try again
      </Typography>
    )
  }

  if (isLoading) {
    return (
      <Typography color="info" variant="body1">
        Loading users...
      </Typography>
    )
  }

  return null
}
