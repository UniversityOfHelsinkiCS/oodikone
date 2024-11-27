import { HelpOutline } from '@mui/icons-material'
import { Button, IconButton, Tooltip, Typography } from '@mui/material'
import ReactMarkdown from 'react-markdown'

import { formatContent } from '@/common'

export const InfoBox = ({
  content,
  cypress = '',
  mini = false,
}: {
  content: string
  cypress?: string
  mini?: boolean
}) => {
  return (
    <Tooltip
      arrow
      title={
        <Typography component="div" data-cy={`${cypress}InfoBoxContent`} sx={{ padding: 1 }} variant="body2">
          <ReactMarkdown>{formatContent(content)}</ReactMarkdown>
        </Typography>
      }
    >
      {mini ? (
        <IconButton data-cy={`${cypress}InfoBoxButton`} sx={{ padding: 0 }}>
          <HelpOutline fontSize="small" />
        </IconButton>
      ) : (
        <Button color="info" data-cy={`${cypress}InfoBoxButton`} startIcon={<HelpOutline />} variant="outlined">
          Info
        </Button>
      )}
    </Tooltip>
  )
}
