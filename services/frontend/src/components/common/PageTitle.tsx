import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export const PageTitle = ({
  subtitle,
  title,
  children,
}: {
  subtitle?: string
  title?: string
  children?: React.ReactNode
}) => {
  return (
    <Stack sx={{ my: 3, textAlign: 'center', minWidth: '100%' }}>
      <Typography variant="h4">{title ?? <Skeleton height="100%" variant="text" width="100%" />}</Typography>
      {subtitle ? (
        <Typography color="text.secondary" fontWeight="500" variant="h6">
          {subtitle}
        </Typography>
      ) : null}
      <Box>{children}</Box>
    </Stack>
  )
}
