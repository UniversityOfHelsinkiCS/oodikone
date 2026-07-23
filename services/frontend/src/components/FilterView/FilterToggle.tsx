import Tooltip from '@mui/material/Tooltip'

import { FilterToggleIcon } from '@/components/common/FilterToggleIcon'

export const FilterToggle = ({ active, applyFilter, clearFilter, popupContent, disabled }) => (
  <Tooltip title={disabled ? null : popupContent}>
    <span style={{ display: 'flex', flex: '1' }}>
      <FilterToggleIcon disabled={disabled} isActive={active} onClick={active ? clearFilter : applyFilter} />
    </span>
  </Tooltip>
)
