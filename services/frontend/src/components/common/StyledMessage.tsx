import Alert from '@mui/material/Alert'
import type { SxProps } from '@mui/material/styles'

export const StyledMessage = ({ children, style }: { children: React.ReactNode, style?: SxProps }) => (
  <Alert icon={false} severity="info" sx={{ margin: 'auto', maxWidth: '800px', ...style }} variant="outlined">
    {children}
  </Alert>
)
