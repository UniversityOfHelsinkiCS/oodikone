import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'

export const FilterOldProgrammesToggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <FormControlLabel
    control={<Switch checked={checked} onChange={onChange} />}
    label="Filter out old and specialized programmes"
  />
)
