import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Popper from '@mui/material/Popper'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'

type ValidValueType = string

type SelectOption<T extends ValidValueType> = {
  key?: string
  text: string
  value: T
  disabled?: boolean
}

type FilterSearchableSelectProps<T extends ValidValueType> = {
  label: string
  options: SelectOption<T>[]
  value: SelectOption<T> | SelectOption<T>[] | null
  onChange: (target: any) => void // target varies per implementation
  filterKey: string
  multiple?: boolean
}

/**
 * Matches arbitrary user input against values in options.
 * Multiple values can be entered, accepted separators: [',', ';', '\n' ' ']
 */
const matchUserInput = (options: SelectOption<string>[], target: any[]) => {
  const parsedInput = target.flatMap(item => item.split(/[\s,;]+/).filter(Boolean))
  return options.filter(opt => parsedInput.includes(opt.value)).map(opt => opt.value)
}

export const FilterSearchableSelect = <T extends ValidValueType = string>({
  label,
  value,
  options,
  onChange,
  filterKey,
  multiple,
}: FilterSearchableSelectProps<T>) => {
  const disabled = !options.length

  const CustomWidthPopper = props => (
    <Popper
      {...props}
      id={`${filterKey}-popper`}
      placement="bottom-start"
      style={{ minWidth: '14em', maxWidth: '40em' }}
    />
  )

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Tooltip title={disabled ? 'No valid values found' : ''}>
        <Autocomplete
          autoHighlight
          blurOnSelect
          clearOnEscape
          data-cy={`${filterKey}-selector`}
          disabled={disabled}
          filterSelectedOptions
          freeSolo={multiple}
          fullWidth
          getOptionLabel={opt => (typeof opt === 'string' ? opt : opt.text)}
          limitTags={5}
          multiple={multiple}
          onChange={(_, target, reason) => {
            // Target is always an array if multiple is enabled
            if (multiple && Array.isArray(target)) {
              if (reason === 'createOption') {
                onChange(matchUserInput(options, target))
              } else {
                onChange(target.map(item => (typeof item === 'string' ? item : item.value)))
              }
            } else if (target !== null && typeof target !== 'string' && !Array.isArray(target)) {
              // When not in multiple mode (=freesolo is off) target is always SelectOption<T>
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
