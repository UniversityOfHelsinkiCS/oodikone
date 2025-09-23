import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Popper from '@mui/material/Popper'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'

type ValidValueType = string | number

type SelectOption<T extends ValidValueType> = {
  key?: string
  text: string
  value: T
  disabled?: boolean
}

type FilterSearchableSelectProps<T extends ValidValueType> = {
  label: string
  options: SelectOption<T>[]
  value: SelectOption<T> | null
  onChange: (target: SelectOption<T>) => void
  filterKey: string
}

const CustomWidthPopper = props => <Popper {...props} placement="bottom-start" style={{ width: '40em' }} />

export const FilterSearchableSelect = <T extends ValidValueType = string>({
  label,
  value,
  options,
  onChange,
  filterKey,
}: FilterSearchableSelectProps<T>) => {
  const disabled = !options.length

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Tooltip title={disabled ? 'No valid values found' : ''}>
        <Autocomplete
          autoHighlight
          blurOnSelect
          clearOnEscape
          data-cy={`${filterKey}-selector`}
          disabled={disabled}
          fullWidth
          getOptionLabel={opt => opt.text}
          onChange={(_, target) => {
            if (target !== null) {
              onChange(target)
            }
          }}
          options={options}
          renderInput={params => <TextField {...params} id={`${filterKey}-label`} label={label} size="small" />}
          slots={{
            popper: CustomWidthPopper,
          }}
          value={value}
        />
      </Tooltip>
    </Box>
  )
}
