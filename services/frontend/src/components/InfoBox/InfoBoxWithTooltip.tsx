import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import { SxProps, Theme } from '@mui/material/styles'
import styled from '@mui/material/styles/styled'
import Tooltip, { tooltipClasses, TooltipProps } from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import ReactMarkdown from 'react-markdown'

import { formatContent } from '@/common'

const CustomWidthTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 700,
  },
})

export const InfoBox = ({
  content,
  cypress = '',
  mini = false,
  sx,
}: {
  content: string
  cypress?: string
  mini?: boolean
  sx?: SxProps<Theme>
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
        <IconButton data-cy={`${cypress}-info-box-button`} sx={{ padding: 0, ...sx }}>
          <HelpOutlineIcon color="info" fontSize="small" />
        </IconButton>
      ) : (
        <Button
          color="info"
          data-cy={`${cypress}-info-box-button`}
          startIcon={<HelpOutlineIcon />}
          sx={sx}
          variant="contained"
        >
          Info
        </Button>
      )}
    </CustomWidthTooltip>
  )
}
