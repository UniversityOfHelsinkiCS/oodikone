import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'

import { FilterTrayProps } from '../FilterTray'
import { createFilter } from './createFilter'

const GENDERS = {
  female: { label: 'Female', value: 2 },
  male: { label: 'Male', value: 1 },
  other: { label: 'Other', value: 3 },
  unknown: { label: 'Unknown', value: 0 },
}

const GenderFilterCard = ({ options, onOptionsChange, students }: FilterTrayProps) => {
  const { selected } = options

  const count = (genderCode: number) => students.filter(student => Number(student.gender_code) === genderCode).length

  const dropdownOptions = Object.entries(GENDERS).map(([key, { label, value }]) => ({
    key,
    text: `${label} (${count(value)})`,
    value,
  }))

  return (
    <Box className="card-content">
      <FormControl fullWidth>
        <InputLabel id="genderFilter-select-label">Choose curriculum period</InputLabel>
        <Select
          data-cy="genderFilter-dropdown"
          labelId="genderFilter-select-label"
          onChange={(event: SelectChangeEvent) => onOptionsChange({ selected: event.target.value })}
          value={selected}
        >
          {dropdownOptions.map(({ key, value, text }) => (
            <MenuItem key={key} value={value}>
              {text}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

export const genderFilter = createFilter({
  key: 'Gender',

  title: 'Gender',

  defaultOptions: {
    selected: '',
  },

  isActive: ({ selected }) => !!selected,

  filter(student, { options }) {
    const { selected } = options

    return Number(student.gender_code) === selected
  },

  render: GenderFilterCard,
})
