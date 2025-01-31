import { FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material'

export const YearFilter = ({
  fromYear,
  handleFromYearChange,
  handleToYearChange,
  toYear,
  years,
}: {
  fromYear: number
  handleFromYearChange: (event) => void
  handleToYearChange: (event) => void
  toYear: number
  years: Array<{ key: number; text: string; value: number }>
}) => {
  const style = { width: 150 }
  const menuProps = {
    PaperProps: {
      style: {
        maxHeight: 200,
      },
    },
  }

  return (
    <Stack direction="row" gap={2}>
      <FormControl size="small" variant="outlined">
        <InputLabel>From</InputLabel>
        <Select
          MenuProps={menuProps}
          label="From"
          name="fromYear"
          onChange={handleFromYearChange}
          sx={style}
          value={fromYear || ''}
        >
          {years
            .filter(({ value }) => !toYear || value <= toYear)
            .map(({ key, text, value }) => (
              <MenuItem key={key} value={value}>
                {text}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      <FormControl size="small" variant="outlined">
        <InputLabel>To</InputLabel>
        <Select
          MenuProps={menuProps}
          label="To"
          name="toYear"
          onChange={handleToYearChange}
          sx={style}
          value={toYear || ''}
        >
          {years
            .filter(({ value }) => !fromYear || value >= fromYear)
            .map(({ key, text, value }) => (
              <MenuItem key={key} value={value}>
                {text}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </Stack>
  )
}
