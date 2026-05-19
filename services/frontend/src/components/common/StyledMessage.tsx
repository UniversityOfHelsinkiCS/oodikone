import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import type { SxProps } from '@mui/material/styles'

export const StyledMessage = ({
  children,
  variant = 'outlined',
  severity = 'info',
  sx: propSx,
  showIcon,
  title,
}: {
  children: React.ReactNode
  variant?: 'outlined' | 'standard' | 'filled'
  severity?: 'info' | 'success' | 'warning' | 'error'
  sx?: SxProps
  showIcon?: boolean
  title?: string
}) => (
  <Alert
    icon={showIcon ? null : false} // Null keeps icon enabled (default behaviour)
    severity={severity}
    sx={{ margin: 'auto', maxWidth: '800px', ...propSx }}
    variant={variant}
  >
    {title?.length ? <AlertTitle>{title}</AlertTitle> : null}
    {children}
  </Alert>
)
