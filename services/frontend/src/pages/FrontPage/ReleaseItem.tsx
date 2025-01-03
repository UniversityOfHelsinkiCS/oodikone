import { Box, Typography } from '@mui/material'
import ReactMarkdown from 'react-markdown'

import { getDescription } from '@/common'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { Release } from '@/shared/types'
import { reformatDate } from '@/util/timeAndDate'

export const ReleaseItem = ({ isLoading, release }: { isLoading: boolean; release: Release }) => {
  return (
    <Box>
      <Typography component="h4" variant="h6">
        {isLoading ? 'Loading title...' : release.title}
      </Typography>
      <Typography component="p" variant="caption">
        {isLoading ? 'Loading date...' : reformatDate(release.time, DISPLAY_DATE_FORMAT)}
      </Typography>
      <Typography component="div" variant="body1">
        <ReactMarkdown>{isLoading ? 'Loading description...' : getDescription(release.description)}</ReactMarkdown>
      </Typography>
    </Box>
  )
}
