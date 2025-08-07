import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

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
    <Paper data-cy={`${cypress}-section`} sx={{ padding: 2 }} variant="outlined">
      <Stack alignItems="center" direction="row" justifyContent="space-between" sx={{ paddingBottom: 1 }}>
        <Typography component="h2" variant="h5">
          {title}
        </Typography>
        <Stack direction="row" gap={1}>
          {exportOnClick ? (
            <ExportButton cypress={cypress} disabled={isError || isLoading} onClick={exportOnClick} />
          ) : null}
          {infoBoxContent ? <InfoBox content={infoBoxContent} cypress={cypress} /> : null}
        </Stack>
      </Stack>
      <Box sx={{ marginTop: title ? 2 : 0 }}>
        {isError ? <ErrorMessage /> : isLoading ? <LoadingSkeleton /> : children}
      </Box>
    </Paper>
  )
}
