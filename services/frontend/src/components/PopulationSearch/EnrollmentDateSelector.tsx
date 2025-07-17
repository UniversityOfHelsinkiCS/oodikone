import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { FilterOldProgrammesToggle } from '@/components/common/FilterOldProgrammesToggle'

type EnrollmentDateSelectorProps = {
  year: number
  setYear: React.Dispatch<React.SetStateAction<number>>
  filterProgrammes: boolean
  setFilterProgrammes: React.Dispatch<React.SetStateAction<boolean>>
  fullAccessToStudentData: boolean
}

export const EnrollmentDateSelector = ({
  year,
  setYear,
  filterProgrammes,
  setFilterProgrammes,
  fullAccessToStudentData,
}: EnrollmentDateSelectorProps) => {
  const currentYear = new Date().getFullYear()
  const lowestYear = 1970
  const options = [...Array(currentYear + 1 - lowestYear).keys()].map(value => lowestYear + value)
  return (
    <Box>
      <Typography fontWeight="bold" sx={{ mb: 1 }} variant="subtitle1">
        Class of
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 0 }}>
        <IconButton
          data-cy="population-year-decrement"
          disabled={year <= lowestYear}
          onClick={() => setYear(year => (year > lowestYear ? year - 1 : year))}
        >
          <RemoveIcon />
        </IconButton>
        <Select
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 300,
              },
            },
          }}
          data-cy="population-year-selector"
          onChange={({ target: { value } }) => setYear(parseInt(value, 10))}
          sx={{ width: 'fit-content', pl: 1, pr: 1 }}
          value={year.toString()}
        >
          {options.map(option => (
            <MenuItem
              key={option}
              sx={{ justifyContent: 'center' }}
              value={option}
            >{`${option} - ${option + 1}`}</MenuItem>
          ))}
        </Select>
        <IconButton
          data-cy="population-year-increment"
          disabled={year >= currentYear}
          onClick={() => setYear(year => year + 1)}
        >
          <AddIcon />
        </IconButton>
        {fullAccessToStudentData && (
          <FilterOldProgrammesToggle checked={filterProgrammes} onChange={() => setFilterProgrammes(prev => !prev)} />
        )}
      </Stack>
    </Box>
  )
}
