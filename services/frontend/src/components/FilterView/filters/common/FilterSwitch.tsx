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
  filterKey: string
}

const SwitchButton = ({ filterKey, option }: { filterKey: string; option: SwitchOption }) => (
  <FormControlLabel
    checked={!!option.checked}
    control={<Switch />}
    data-cy={`${filterKey}-radio-${option.key}`}
    label={option.text}
    onClick={option.onClick}
  />
)

export const FilterSwitch = ({ options, filterKey }: FilterSwitchProps) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      {options.map(option => (
        <SwitchButton filterKey={filterKey} key={option.key} option={option} />
      ))}
    </Box>
  )
}
