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
        <Typography component="div" data-cy={`${cypress}-info-content`} sx={{ padding: 1 }} variant="body2">
          <ReactMarkdown>{formatContent(content)}</ReactMarkdown>
        </Typography>
      }
    >
      {mini ? (
        <IconButton>
          <HelpOutline fontSize="small" />
        </IconButton>
      ) : (
        <Button color="info" startIcon={<HelpOutline />} variant="outlined">
          Info
        </Button>
      )}
    </Tooltip>
  )
}
