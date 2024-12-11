import { HelpOutline } from '@mui/icons-material'
import { Button, IconButton, Tooltip, tooltipClasses, TooltipProps, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import ReactMarkdown from 'react-markdown'

import { formatContent } from '@/common'

const CustomWidthTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 500,
  },
})

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
    <CustomWidthTooltip
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
        <Button color="info" data-cy={`${cypress}InfoBoxButton`} startIcon={<HelpOutline />} variant="contained">
          Info
        </Button>
      )}
    </CustomWidthTooltip>
  )
}
