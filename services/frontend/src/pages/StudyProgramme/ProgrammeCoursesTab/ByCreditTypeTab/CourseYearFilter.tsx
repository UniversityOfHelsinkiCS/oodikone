import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { Toggle } from '@/components/material/Toggle'
import { ToggleContainer } from '@/components/material/ToggleContainer'

export const CourseYearFilter = ({
  academicYear,
  fromYear,
  handleFromYearChange,
  handleToYearChange,
  setAcademicYear,
  toYear,
  years,
}: {
  academicYear: boolean
  fromYear: number
  handleFromYearChange: (event) => void
  handleToYearChange: (event) => void
  setAcademicYear: (value: boolean) => void
  toYear: number
  years: { text: string; value: number }[]
}) => {
  return (
    <>
      <Typography component="h4" variant="h6">
        Time range
      </Typography>
      <Stack direction="row" gap={1}>
        <FormControl fullWidth>
          <InputLabel>From</InputLabel>
          <Select data-cy="from-year-select" label="From" onChange={handleFromYearChange} value={fromYear}>
            {years
              .filter(({ value }) => !toYear || value <= toYear)
              .map(({ text, value }) => (
                <MenuItem data-cy={`from-year-select-option-${value}`} key={value} value={value}>
                  {text}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>To</InputLabel>
          <Select data-cy="to-year-select" label="To" onChange={handleToYearChange} value={toYear}>
            {years
              .filter(({ value }) => !fromYear || value >= fromYear)
              .map(({ text, value }) => (
                <MenuItem data-cy={`to-year-select-option-${value}`} key={value} value={value}>
                  {text}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Stack>
      <ToggleContainer>
        <Toggle
          cypress="year-toggle"
          firstLabel="Calendar year"
          infoBoxContent={studyProgrammeToolTips.yearToggle}
          secondLabel="Academic year"
          setValue={setAcademicYear}
          value={academicYear}
        />
      </ToggleContainer>
    </>
  )
}
