import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'

type SelectOption = {
  key?: string
  text: string
  value: string
  amount?: number
}

type FilterSelectProps = {
  label?: string
  options: SelectOption[]
  value: string | undefined
  onChange: (event: SelectChangeEvent) => void
  filterKey?: string
}

export const FilterSelect = ({ label, value, options, onChange, filterKey }: FilterSelectProps) => (
  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
    <FormControl sx={{ width: '95%' }} variant="outlined">
      <InputLabel id={filterKey} size="small">
        {label}
      </InputLabel>
      <Select
        data-cy={`${filterKey}-selector`}
        label={label}
        labelId={filterKey}
        onChange={onChange}
        size="small"
        value={value ?? ''}
      >
        {options.map(option => (
          <MenuItem key={option.key} value={option.value}>
            {option.text}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Box>
)
