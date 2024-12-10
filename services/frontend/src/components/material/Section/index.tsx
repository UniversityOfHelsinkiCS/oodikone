import { Box, Paper, Stack, Typography } from '@mui/material'

import { InfoBox } from '@/components/material/InfoBox'
import { ErrorMessage } from './ErrorMessage'
import { ExportButton } from './ExportButton'
import { LoadingSkeleton } from './LoadingSkeleton'

export const Section = ({
  children,
  cypress = '',
  exportOnClick,
  infoBoxContent,
  isLoading = false,
  isError = false,
  title,
}: {
  children: React.ReactNode
  cypress?: string
  exportOnClick?: () => void
  infoBoxContent?: string
  isLoading?: boolean
  isError?: boolean
  title?: string
}) => {
  return (
    <Paper data-cy={cypress} sx={{ padding: 2 }} variant="outlined">
      {title && (
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Typography component="h2" variant="h5">
            {title}
          </Typography>
          <Stack direction="row" gap={1}>
            {exportOnClick && (
              <ExportButton cypress={cypress} disabled={isError || isLoading} onClick={exportOnClick} />
            )}
            {infoBoxContent && <InfoBox content={infoBoxContent} cypress={cypress} />}
          </Stack>
        </Stack>
      )}
      <Box sx={{ marginTop: title ? 2 : 0 }}>
        {isError ? <ErrorMessage /> : isLoading ? <LoadingSkeleton /> : children}
      </Box>
    </Paper>
  )
}
