import { HelpOutline } from '@mui/icons-material'
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material'
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
        <Box sx={{ padding: 1 }}>
          <Typography data-cy={`${cypress}-info-content`} variant="body2">
            <ReactMarkdown>{formatContent(content)}</ReactMarkdown>
          </Typography>
        </Box>
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
