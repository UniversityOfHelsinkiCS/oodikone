import { ErrorOutline as ErrorIcon } from '@mui/icons-material'
import { Box, CircularProgress, Paper, Skeleton, Stack, Typography } from '@mui/material'

import { InfoBox } from '@/components/material/InfoBox'

const ErrorMessage = () => {
  return (
    <Box
      sx={{
        alignItems: 'center',
        border: 1,
        borderRadius: 1,
        color: theme => theme.palette.error.main,
        display: 'flex',
        height: 400,
        justifyContent: 'center',
      }}
    >
      <Stack alignItems="center" direction="column" gap={2}>
        <ErrorIcon fontSize="large" />
        <Typography color="inherit" fontStyle="italic" textAlign="center" variant="body1">
          Something went wrong, please try refreshing the page
        </Typography>
      </Stack>
    </Box>
  )
}

const LoadingSkeleton = () => {
  return (
    <Box sx={{ height: 400, position: 'relative' }}>
      <Skeleton height={400} variant="rectangular" />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <Stack alignItems="center" direction="column" gap={2}>
          <CircularProgress />
          <Typography color="text.secondary" fontStyle="italic" variant="body1">
            Loading content
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}

export const Section = ({
  children,
  cypress,
  infoBoxContent,
  isLoading,
  isError,
  title,
}: {
  children: React.ReactNode
  cypress?: string
  infoBoxContent?: string
  isLoading?: boolean
  isError?: boolean
  title?: string
}) => {
  return (
    <Paper sx={{ padding: 2 }} variant="outlined">
      {title && (
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Typography component="h2" variant="h5">
            {title}
          </Typography>
          {infoBoxContent && <InfoBox content={infoBoxContent} cypress={cypress} />}
        </Stack>
      )}
      <Box sx={{ marginTop: title ? 2 : 0 }}>
        {isError ? <ErrorMessage /> : isLoading ? <LoadingSkeleton /> : children}
      </Box>
    </Paper>
  )
}
