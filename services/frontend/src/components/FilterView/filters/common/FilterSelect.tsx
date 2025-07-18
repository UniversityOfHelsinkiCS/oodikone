import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'

// HACK: This is ripped off of MUI MenuItem error.
// TODO: Find an actual type to replace this.
type ValidValueType = string | number

type SelectOption<T extends ValidValueType> = {
  key?: string
  text: string
  value: T
  disabled?: boolean
}

type FilterSelectProps<T extends ValidValueType> = {
  label?: string
  options: SelectOption<T>[]
  value: T | T[]
  onChange: (event: SelectChangeEvent<T | T[]>) => void
  filterKey?: string
  multiple?: true
  InputItem?: (value: T | T[]) => JSX.Element
  MenuItem?: (option: SelectOption<T>) => JSX.Element
}

const DefaultMenuItem = option => (
  <MenuItem disabled={option.disabled} key={option.key} value={option.value}>
    {option.text}
  </MenuItem>
)

export const FilterSelect = <T extends ValidValueType = string>({
  label,
  value,
  options,
  onChange,
  filterKey,
  multiple,
  InputItem,
  MenuItem,
}: FilterSelectProps<T>) => (
  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
    <FormControl sx={{ width: '95%' }} variant="outlined">
      <InputLabel id={filterKey} size="small">
        {label}
      </InputLabel>
      <Select
        data-cy={`${filterKey}-selector`}
        label={label}
        labelId={filterKey}
        multiple={multiple}
        onChange={onChange}
        renderValue={InputItem}
        size="small"
        value={value}
      >
        {options.map(MenuItem ?? DefaultMenuItem)}
      </Select>
    </FormControl>
  </Box>
)
