import FilterAltOutlinedIcon from '@mui/icons-material/FilterAlt'
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOff'
import Button from '@mui/material/Button'

export const FilterToggleIcon = ({
  isActive,
  onClick,
  disabled,
}: {
  isActive: boolean
  disabled?: true
  onClick: () => void
}) => {
  const Icon = isActive ? FilterAltOffOutlinedIcon : FilterAltOutlinedIcon

  return (
    <Button disabled={disabled} onClick={onClick} variant={isActive ? 'contained' : 'outlined'}>
      <Icon fontSize="small" />
    </Button>
  )
}
