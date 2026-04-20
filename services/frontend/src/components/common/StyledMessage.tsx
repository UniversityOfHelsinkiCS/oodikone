import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import type { SxProps } from '@mui/material/styles'

export const StyledMessage = ({
  children,
  variant = 'outlined',
  sx: propSx,
  showIcon,
  title,
}: {
  children: React.ReactNode
  variant?: 'outlined' | 'standard' | 'filled'
  sx?: SxProps
  showIcon?: boolean
  title?: string
}) => (
  <Alert
    icon={showIcon ? null : false} // Null keeps icon enabled (default behaviour)
    severity="info"
    sx={{ margin: 'auto', maxWidth: '800px', ...propSx }}
    variant={variant}
  >
    {title?.length ? <AlertTitle>{title}</AlertTitle> : null}
    {children}
  </Alert>
)
