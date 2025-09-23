import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup, { type RadioGroupProps, useRadioGroup } from '@mui/material/RadioGroup'

type RadioOption<T> = {
  key: string | undefined
  text: string
  value: T
}

type FilterRadioProps<T> = {
  defaultValue: RadioOption<T>['value']
  controlledValue?: RadioOption<T>['value']
  options: RadioOption<T>[]
  filterKey: string
  onChange: RadioGroupProps['onChange']
}

const RadioButton = <T,>({ filterKey, option }: { filterKey: string; option: RadioOption<T> }) => {
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

export const FilterRadio = <T,>({
  defaultValue,
  controlledValue,
  options,
  onChange,
  filterKey,
}: FilterRadioProps<T>) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'left', px: 1 }}>
      <RadioGroup defaultValue={defaultValue} name={filterKey} onChange={onChange} value={controlledValue}>
        {options.map(option => (
          <RadioButton filterKey={filterKey} key={option.key} option={option} />
        ))}
      </RadioGroup>
    </Box>
  )
}
