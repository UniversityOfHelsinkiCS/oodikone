import { FormControlLabel, Switch } from '@mui/material'

export const FilterOldProgrammesToggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => {
  return (
    <FormControlLabel
      control={<Switch checked={checked} onChange={onChange} />}
      label="Filter out old and specialized programmes"
    />
  )
}
