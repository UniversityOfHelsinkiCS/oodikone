import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'

export const FilterOldProgrammesToggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => {
  return (
    <FormControlLabel
      control={<Switch checked={checked} onChange={onChange} />}
      data-cy="filter-old-programmes-toggle"
      label="Filter out old and specialized programmes"
    />
  )
}
