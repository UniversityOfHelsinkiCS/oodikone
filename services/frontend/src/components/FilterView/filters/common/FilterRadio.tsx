import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup, { type RadioGroupProps, useRadioGroup } from '@mui/material/RadioGroup'

// Like FilterSelect this type is ripped off of typescript errors.
// TODO: Find an actual type to replace this.
type ValidValueType = string

type SelectOption<T extends ValidValueType> = {
  key?: string
  text: string
  value: T
  amount?: number
}

type FilterRadioProps<T extends ValidValueType> = {
  defaultOption: SelectOption<T>
  options: SelectOption<T>[]
  filterKey?: string
  onChange: RadioGroupProps['onChange']
}

export const FilterRadio = <T extends ValidValueType = string>({
  defaultOption,
  options,
  onChange,
  filterKey,
}: FilterRadioProps<T>) => {
  const RadioButton = ({ option }: { option: SelectOption<T> }) => {
    const radioGroup = useRadioGroup()

    return (
      <FormControlLabel
        checked={radioGroup?.value === String(option.value)}
        control={<Radio />}
        data-cy={`${filterKey}-radio-${option.key}`}
        label={option.text}
        value={option.value}
      />
    )
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <RadioGroup defaultValue={defaultOption.value} name="mygroup" onChange={onChange}>
        <RadioButton option={defaultOption} />
        {options.map(option => (
          <RadioButton key={option.key} option={option} />
        ))}
      </RadioGroup>
    </Box>
  )
}
