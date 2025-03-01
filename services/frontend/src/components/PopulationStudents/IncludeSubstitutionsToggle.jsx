import { FormControlLabel, Switch } from '@mui/material'

export const IncludeSubstitutionsToggle = ({ includeSubstitutions, toggleIncludeSubstitutions }) => (
  <FormControlLabel
    control={<Switch checked={includeSubstitutions} onChange={toggleIncludeSubstitutions} />}
    label="Include substitutions"
    sx={{ margin: 0 }}
  />
)
