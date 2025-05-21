import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

export const ToggleVisibilityButton = ({ onClick, visible }: { onClick: any; visible: boolean }) => {
  return (
    <Tooltip arrow placement="top" title={visible ? 'Set hidden' : 'Set visible'}>
      <IconButton data-cy="toggle-visibility-button" onClick={onClick}>
        {visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
      </IconButton>
    </Tooltip>
  )
}
