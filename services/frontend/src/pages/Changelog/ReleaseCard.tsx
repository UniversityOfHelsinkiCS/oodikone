import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'

import ReactMarkdown from 'react-markdown'

import { getDescription } from '@/common'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { reformatDate } from '@/util/timeAndDate'
import { Release } from '@oodikone/shared/types'

export const ReleaseCard = ({ isLoading, release }: { isLoading: boolean; release: Release }) => {
  return (
    <Card sx={{ padding: 2 }} variant="outlined">
      <Typography component="h4" sx={{ mb: 1 }} variant="h6">
        {isLoading ? 'Loading title...' : release.title}
      </Typography>
      <Typography component="p" sx={{ color: 'text.secondary', mb: 2 }} variant="caption">
        {isLoading
          ? 'Loading date...'
          : `Version ${release.version} • Released on ${reformatDate(release.time, DISPLAY_DATE_FORMAT)}`}
      </Typography>
      <ReactMarkdown>{isLoading ? 'Loading description...' : getDescription(release.description)}</ReactMarkdown>
    </Card>
  )
}
