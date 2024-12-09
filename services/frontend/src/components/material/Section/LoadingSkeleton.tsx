import { Box, CircularProgress, Skeleton, Stack, Typography } from '@mui/material'

export const LoadingSkeleton = () => {
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
