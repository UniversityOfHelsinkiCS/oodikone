import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import styled from '@mui/material/styles/styled'
import Tooltip, { tooltipClasses, TooltipProps } from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

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
        <Typography component="div" data-cy={`${cypress}-info-box-content`} sx={{ padding: 1 }} variant="body2">
          <ReactMarkdown>{formatContent(content)}</ReactMarkdown>
        </Typography>
      }
    >
      {mini ? (
        <IconButton data-cy={`${cypress}-info-box-button`} sx={{ padding: 0 }}>
          <HelpOutlineIcon color="info" fontSize="small" />
        </IconButton>
      ) : (
        <Button color="info" data-cy={`${cypress}-info-box-button`} startIcon={<HelpOutlineIcon />} variant="contained">
          Info
        </Button>
      )}
    </CustomWidthTooltip>
  )
}
