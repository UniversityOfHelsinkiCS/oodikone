import Stack from '@mui/material/Stack'

import { DateSelector, type DateSelectorValue } from '@/components/DateSelector'

export const DateRangeSelector = ({
  value: [start, end],
  onChange,
  showSemesters,
}: {
  value: [DateSelectorValue, DateSelectorValue]
  onChange: (input: [DateSelectorValue, DateSelectorValue]) => void
  showSemesters: boolean
}) => {
  return (
    <Stack spacing={1}>
      <Stack>
        <label>Beginning:</label>
        <DateSelector
          before={end}
          onChange={date => onChange([date, end])}
          showSemesters={showSemesters}
          value={start}
        />
      </Stack>
      <Stack>
        <label>Ending:</label>
        <DateSelector
          after={start}
          onChange={date => onChange([start, date])}
          showSemesters={showSemesters}
          value={end}
        />
      </Stack>
    </Stack>
  )
}
