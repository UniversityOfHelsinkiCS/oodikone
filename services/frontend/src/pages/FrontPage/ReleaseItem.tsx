import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import ReactMarkdown from 'react-markdown'

import { getDescription } from '@/common'
import { DateFormat } from '@/constants/date'
import { reformatDate } from '@/util/timeAndDate'
import { Release } from '@oodikone/shared/types'

export const ReleaseItem = ({ isLoading, release }: { isLoading: boolean; release: Release }) => {
  return (
    <Box>
      <Typography component="h4" variant="h6">
        {isLoading ? 'Loading title...' : release.title}
      </Typography>
      <Typography component="p" variant="caption">
        {isLoading ? 'Loading date...' : reformatDate(release.time, DateFormat.DISPLAY_DATE)}
      </Typography>
      <Typography component="div" variant="body1">
        <ReactMarkdown>{isLoading ? 'Loading description...' : getDescription(release.description)}</ReactMarkdown>
      </Typography>
    </Box>
  )
}
