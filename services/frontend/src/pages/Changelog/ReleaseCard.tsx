import { Card, Typography } from '@mui/material'
import ReactMarkdown from 'react-markdown'

import { getDescription } from '@/common'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { Release } from '@/shared/types'
import { reformatDate } from '@/util/timeAndDate'

export const ReleaseCard = ({ isLoading, release }: { isLoading: boolean; release: Release }) => {
  return (
    <Card sx={{ padding: 2 }} variant="outlined">
      <Typography component="h4" sx={{ mb: 1 }} variant="h6">
        {isLoading ? 'Loading title...' : release.title}
      </Typography>
      <Typography component="p" sx={{ color: 'text.secondary', mb: 2 }} variant="caption">
        {isLoading ? 'Loading date...' : `Released on ${reformatDate(release.time, DISPLAY_DATE_FORMAT)}`}
      </Typography>
      <ReactMarkdown>{isLoading ? 'Loading description...' : getDescription(release.description)}</ReactMarkdown>
    </Card>
  )
}
