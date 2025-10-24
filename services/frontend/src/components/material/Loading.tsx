import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper, { PaperProps } from '@mui/material/Paper'

export const Loading = () => {
  return (
    <Box display="flex" justifyContent="center" width="100%">
      <CircularProgress />
    </Box>
  )
}

export const LoadingSection = ({ ...sectionProps }: PaperProps) => {
  return (
    <Paper variant="outlined" {...sectionProps}>
      <Loading />
    </Paper>
  )
}

/**
 * Dims and occupies the full screen
 */
export const PageLoading = ({ isLoading }: { isLoading: boolean }) => (
  <Backdrop
    open={isLoading}
    sx={theme => ({ color: theme.palette.grey[300], zIndex: theme => theme.zIndex.drawer + 1 })}
  >
    <CircularProgress color="inherit" size="3em" />
  </Backdrop>
)
