import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup, { type RadioGroupProps, useRadioGroup } from '@mui/material/RadioGroup'

type RadioOption = {
  key: string | undefined
  text: string
  value: string
}

type FilterRadioProps = {
  defaultOption: RadioOption
  options: RadioOption[]
  filterKey: string
  onChange: RadioGroupProps['onChange']
}

export const FilterRadio = ({ defaultOption, options, onChange, filterKey }: FilterRadioProps) => {
  const RadioButton = ({ option }: { option: RadioOption }) => {
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
      <RadioGroup defaultValue={defaultOption.value} name={filterKey} onChange={onChange}>
        <RadioButton option={defaultOption} />
        {options.map(option => (
          <RadioButton key={option.key} option={option} />
        ))}
      </RadioGroup>
    </Box>
  )
}
