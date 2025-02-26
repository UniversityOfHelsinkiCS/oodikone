import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material'
import { Button, CircularProgress, Stack } from '@mui/material'

export const UpdateButton = ({
  stats,
  onClick,
}: {
  stats: {
    isLoading: boolean
    isSuccess: boolean
    isError: boolean
  }
  onClick: () => void
}) => {
  return (
    <Stack alignItems="center" direction="row" spacing={1}>
      <Button disabled={stats.isLoading} onClick={onClick} variant="contained">
        Update
      </Button>
      {stats.isLoading && <CircularProgress size={20} />}
      {stats.isSuccess && <CheckIcon color="success" />}
      {stats.isError && <CloseIcon color="error" />}
    </Stack>
  )
}
