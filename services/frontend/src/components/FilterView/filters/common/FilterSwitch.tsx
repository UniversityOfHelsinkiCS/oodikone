import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'

type SwitchOption = {
  key: string
  text: string
  checked: boolean
  onClick: () => void
}

type FilterSwitchProps = {
  options: SwitchOption[]
  filterKey?: string
}

export const FilterSwitch = ({ options, filterKey }: FilterSwitchProps) => {
  const SwitchButton = ({ option }: { option: SwitchOption }) => {
    return (
      <FormControlLabel
        checked={option.checked}
        control={<Switch />}
        data-cy={`${filterKey}-radio-${option.key}`}
        label={option.text}
        onClick={option.onClick}
      />
    )
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      {options.map(option => (
        <SwitchButton key={option.key} option={option} />
      ))}
    </Box>
  )
}
