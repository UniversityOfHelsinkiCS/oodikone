import Alert from '@mui/material/Alert'
import type { SxProps } from '@mui/material/styles'

export const StyledMessage = ({ children, sx: propSx }: { children: React.ReactNode; sx?: SxProps }) => (
  <Alert icon={false} severity="info" sx={{ margin: 'auto', maxWidth: '800px', ...propSx }} variant="outlined">
    {children}
  </Alert>
)
