import { Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material'
import { IconButton, Tooltip } from '@mui/material'

export const ToggleVisibilityButton = ({ onClick, visible }: { onClick: any; visible: boolean }) => {
  return (
    <Tooltip arrow placement="top" title={visible ? 'Set hidden' : 'Set visible'}>
      <IconButton data-cy="toggle-visibility-button" onClick={onClick}>
        {visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
      </IconButton>
    </Tooltip>
  )
}
