import { Alert, Box, Paper, Skeleton, Stack, Typography } from '@mui/material'

import { InfoBox } from '@/components/material/InfoBox'

const ErrorMessage = () => {
  return (
    <Alert severity="error">
      <Typography variant="body1">Something went wrong, please try refreshing the page.</Typography>
    </Alert>
  )
}

const LoadingSkeleton = () => {
  return <Skeleton height={200} variant="rectangular" />
}

export const Section = ({
  children,
  cypress,
  isLoading,
  isError,
  title,
  infoBoxContent,
}: {
  children: React.ReactNode
  cypress?: string
  isLoading?: boolean
  isError?: boolean
  title: string
  infoBoxContent?: string
}) => {
  return (
    <Paper sx={{ marginBottom: 2, padding: 2 }} variant="outlined">
      <Stack alignItems="center" direction="row" justifyContent="space-between">
        <Typography component="h2" variant="h5">
          {title}
        </Typography>
        {infoBoxContent && <InfoBox content={infoBoxContent} cypress={cypress} />}
      </Stack>
      <Box sx={{ marginTop: 2 }}>{isLoading ? <LoadingSkeleton /> : isError ? <ErrorMessage /> : children}</Box>
    </Paper>
  )
}
