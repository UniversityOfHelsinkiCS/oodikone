import FilterAltIcon from '@mui/icons-material/FilterAlt'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'

export const FilterToggle = ({ active, applyFilter, clearFilter, popupContent, disabled }) => (
  <Tooltip hidden={disabled} title={popupContent}>
    <Button
      disabled={disabled}
      onClick={active ? clearFilter : applyFilter}
      variant={active ? 'contained' : 'outlined'}
    >
      <FilterAltIcon fontSize="small" />
    </Button>
  </Tooltip>
)
