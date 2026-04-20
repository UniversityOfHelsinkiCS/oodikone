import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import type { SxProps } from '@mui/material/styles'

export const StyledMessage = ({
  children,
  sx: propSx,
  showIcon,
  title,
}: {
  children: React.ReactNode
  sx?: SxProps
  showIcon?: boolean
  title?: string
}) => (
  <Alert
    icon={showIcon ? null : false}
    severity="info"
    sx={{ margin: 'auto', maxWidth: '800px', ...propSx }}
    variant="outlined"
  >
    {title?.length ? <AlertTitle>{title}</AlertTitle> : null}
    {children}
  </Alert>
)
