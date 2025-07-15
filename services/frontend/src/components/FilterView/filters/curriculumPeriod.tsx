import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'

import { useMemo } from 'react'
import { FilterTrayProps } from '../FilterTray'
import { createFilter } from './createFilter'

const CurriculumPeriodFilterCard = ({ options, onOptionsChange, students }: FilterTrayProps) => {
  const { selected } = options

  const dropdownOptions = useMemo(
    () =>
      Array.from(new Set(students.map(({ curriculumVersion }) => curriculumVersion).filter(Boolean))).sort((a, b) =>
        b.localeCompare(a)
      ),
    [students]
  )

  return (
    <Box className="card-content">
      <FormControl fullWidth>
        <InputLabel id="curriculumPeriodFilter-select-label">Choose curriculum period</InputLabel>
        <Select
          data-cy="curriculumPeriodFilter-dropdown"
          labelId="curriculumPeriodFilter-select-label"
          onChange={(event: SelectChangeEvent) => onOptionsChange({ selected: event.target.value })}
          value={selected}
        >
          {dropdownOptions.map(value => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

export const curriculumPeriodFilter = createFilter({
  key: 'CurriculumPeriod',

  title: 'Curriculum period',

  defaultOptions: {
    selected: '',
  },

  isActive: ({ selected }) => !!selected,

  filter({ curriculumVersion }, { options }) {
    const { selected } = options

    return selected === curriculumVersion
  },

  render: CurriculumPeriodFilterCard,
})
