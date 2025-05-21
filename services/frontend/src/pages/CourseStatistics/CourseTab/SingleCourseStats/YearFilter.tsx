import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'

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

  const validFromYear = years.some(year => year.value === fromYear) ? fromYear : ''
  const validToYear = years.some(year => year.value === toYear) ? toYear : ''

  return (
    <Stack direction="row" gap={2}>
      <FormControl size="small" variant="outlined">
        <InputLabel>From</InputLabel>
        <Select
          MenuProps={menuProps}
          data-cy="FromYearSelector"
          label="From"
          name="fromYear"
          onChange={handleFromYearChange}
          sx={style}
          value={validFromYear}
        >
          {years
            .filter(({ value }) => !toYear || value <= toYear)
            .map(({ key, text, value }) => (
              <MenuItem data-cy={`FromYearSelectorOption${text}`} key={key} value={value}>
                {text}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      <FormControl size="small" variant="outlined">
        <InputLabel>To</InputLabel>
        <Select
          MenuProps={menuProps}
          data-cy="ToYearSelector"
          label="To"
          name="toYear"
          onChange={handleToYearChange}
          sx={style}
          value={validToYear}
        >
          {years
            .filter(({ value }) => !fromYear || value >= fromYear)
            .map(({ key, text, value }) => (
              <MenuItem data-cy={`ToYearSelectorOption${text}`} key={key} value={value}>
                {text}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </Stack>
  )
}
