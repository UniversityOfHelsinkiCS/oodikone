import Tooltip from '@mui/material/Tooltip'

import { FilterToggleIcon } from '@/components/common/FilterToggleIcon'

export const FilterToggle = ({ active, applyFilter, clearFilter, popupContent, disabled }) => (
  <Tooltip hidden={disabled} title={popupContent}>
    <FilterToggleIcon disabled={disabled} isActive={active} onClick={active ? clearFilter : applyFilter} />
  </Tooltip>
)
