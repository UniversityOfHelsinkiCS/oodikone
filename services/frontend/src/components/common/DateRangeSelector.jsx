import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

import { DateSelector } from '@/components/DateSelector'

export const DateRangeSelector = ({ value, onChange, ...rest }) => {
  const start = value ? value[0] : null
  const end = value ? value[1] : null
  return (
    <Stack>
      <Box>
        <label>Beginning:</label>
        <DateSelector before={end} onChange={date => onChange([date, end])} value={start} {...rest} />
      </Box>
      <Box>
        <label>Ending:</label>
        <DateSelector after={start} onChange={date => onChange([start, date])} value={end} {...rest} />
      </Box>
    </Stack>
  )
}
