import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { SxProps, Theme } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'

// HACK: This is ripped off of MUI MenuItem error.
// TODO: Find an actual type to replace this.
type ValidValueType = string | number

type SelectOption<T extends ValidValueType> = {
  value: T
  text: string
  key?: string
  disabled?: boolean
}

type FilterSelectBaseProps<T extends ValidValueType> = {
  label?: string
  options: SelectOption<T>[]
  filterKey?: string
  MenuItem?: (option: SelectOption<T>) => JSX.Element
  sx?: SxProps<Theme>
}

type SingleFilterSelectProps<T extends ValidValueType> = FilterSelectBaseProps<T> & {
  multiple?: false
  value: T
  onChange: (event: SelectChangeEvent<T>) => void
  InputItem?: (value: T) => JSX.Element
}

type MultiFilterSelectProps<T extends ValidValueType> = FilterSelectBaseProps<T> & {
  multiple: true
  value: T[]
  onChange: (event: SelectChangeEvent<T[]>) => void
  InputItem?: (value: T[]) => JSX.Element
}

type FilterSelectProps<T extends ValidValueType> = SingleFilterSelectProps<T> | MultiFilterSelectProps<T>

const DefaultMenuItem = <T extends ValidValueType>(option: SelectOption<T>) => (
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
  sx,
}: FilterSelectProps<T>) => {
  const disabled = !options.length

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <FormControl fullWidth sx={{ ...sx }} variant="outlined">
        <InputLabel id={`${filterKey}-label`} size="small" sx={{ textOverflow: 'ellipsis', pr: 2.5 }}>
          {label}
        </InputLabel>
        <Tooltip title={disabled ? 'No valid values found' : null}>
          {multiple ? (
            <Select
              data-cy={`${filterKey}-selector`}
              disabled={disabled}
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
          ) : (
            <Select
              data-cy={`${filterKey}-selector`}
              disabled={disabled}
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
          )}
        </Tooltip>
      </FormControl>
    </Box>
  )
}
