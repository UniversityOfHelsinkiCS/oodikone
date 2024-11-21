import { HelpOutline } from '@mui/icons-material'
import { Box, Button, Tooltip, Typography } from '@mui/material'
import ReactMarkdown from 'react-markdown'

import { formatContent } from '@/common'

export const InfoBox = ({ content, cypress = '' }: { content: string; cypress?: string }) => {
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
      <Button color="info" startIcon={<HelpOutline />} variant="outlined">
        Info
      </Button>
    </Tooltip>
  )
}
