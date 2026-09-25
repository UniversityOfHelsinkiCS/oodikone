import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"

import { FilterSelect } from "@/components/FilterView/filters/common/FilterSelect"
import { useDebounce } from "@/hooks/debounce"
import { FilterRange } from "@/components/FilterView/filters/common/FilterRange"

export const TextSelector = ({ label, value, setValue }) => {
  const [debouncedValue, setDebounced] = useDebounce<string>(value, setValue)

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <TextField
        label={label ?? ''}
        onChange={({ target }) => setDebounced(target.value)}
        size="small"
        value={debouncedValue}
      />
    </Box>
  )
}
export const CheckBoxSelector = () => {
  return <p>CheckBox selector</p>
}

export const MultiSelector = ({ value, setValue, options }) => <FilterSelect
    filterKey={'key'}
    label="Choose stuff"
    multiple
    onChange={({ target }) => setValue(target.value as string[])}
    value={value as any}
    options={options}
  />

export const RangeSelector = ({ value, setValue, options }) => {
  const maxVal = Math.max(...options) || 0
  const minVal = Math.min(...options) || 0

  const [debouncedValue, setDebounced] = useDebounce<[number, number]>(value ?? [minVal, maxVal], setValue)


  return (
    <Box sx={{ minWidth: '20em' }}>
      <FilterRange
        text={""}
        min={minVal}
        max={maxVal}
        range={debouncedValue}
        setRange={setDebounced}
        hideIncrements
      />
    </Box>
  )
}

export const DateRangeSelector = () => {
  return <p>Date range selector</p>
}
