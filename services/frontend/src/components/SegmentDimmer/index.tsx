import Backdrop from '@mui/material/Backdrop'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'

export const SegmentDimmer = ({ isLoading = false }) => (
  <Backdrop open={isLoading} sx={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', zIndex: theme => theme.zIndex.drawer + 1 }}>
    <Stack sx={{ alignItems: 'center' }}>
      <CircularProgress color="primary" />
    </Stack>
  </Backdrop>
)
