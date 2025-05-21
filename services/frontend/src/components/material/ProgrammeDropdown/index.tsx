import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'

import { orderBy } from 'lodash'

import { DropdownOption } from '@/types/dropdownOption'
import { DropdownItem } from './DropdownItem'

export const ProgrammeDropdown = ({
  label,
  name,
  onChange,
  options,
  placeholder,
  value,
}: {
  label: string
  name?: string
  onChange: (newProgrammes: string[], name?: string) => void
  options: DropdownOption[]
  placeholder?: string
  value: string[]
}) => {
  return (
    <Autocomplete
      fullWidth
      getOptionLabel={option => option.text}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      multiple
      onChange={(_event, newProgrammes) =>
        onChange(
          newProgrammes.map(value => value.value),
          name
        )
      }
      options={orderBy(options, ['size'], ['desc'])}
      renderInput={params => <TextField {...params} label={label} placeholder={placeholder} variant="outlined" />}
      renderOption={(props, opt) => {
        const option = opt as DropdownOption
        return (
          <li {...props} key={option.value + option.key}>
            <DropdownItem code={option.key} description={option.description} name={option.text} size={option.size} />
          </li>
        )
      }}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => <Chip {...getTagProps({ index })} key={option.value} label={option.text} />)
      }
      value={value.map(val => options.find(option => option.value === val) ?? { text: '', value: '' })}
    />
  )
}
