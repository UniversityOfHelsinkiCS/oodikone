import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export const Loading = () => {
  return (
    <Box display="flex" justifyContent="center" width="100%">
      <CircularProgress />
    </Box>
  )
}
