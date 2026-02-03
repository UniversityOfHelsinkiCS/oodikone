import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'

import { CheckIcon, CloseIcon } from '@/theme'

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
      {stats.isLoading ? <CircularProgress size={20} /> : null}
      {stats.isSuccess ? <CheckIcon color="success" /> : null}
      {stats.isError ? <CloseIcon color="error" /> : null}
    </Stack>
  )
}
