import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'

export const IncludeSubstitutionsToggle = ({
  includeSubstitutions,
  toggleIncludeSubstitutions,
}: {
  includeSubstitutions: boolean
  toggleIncludeSubstitutions: () => void
}) => (
  <FormControlLabel
    control={<Switch checked={includeSubstitutions} onChange={toggleIncludeSubstitutions} />}
    label="Include substitutions"
    sx={{ m: 0 }}
  />
)
