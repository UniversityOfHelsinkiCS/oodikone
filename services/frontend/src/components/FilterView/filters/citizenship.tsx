import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { orderBy } from 'lodash'

import { filterToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { createFilter } from './createFilter'

const CitizenshipFilterCard = ({ options, onOptionsChange, students }) => {
  const { getTextIn } = useLanguage()
  const { selected } = options

  const uniqueContryNames = new Map<string, string>(
    students.flatMap(({ citizenships }) => citizenships).map(citizenship => [citizenship.en, getTextIn(citizenship)])
  )

  const dropdownOptions = [] as any[]
  for (const [countryName, country] of uniqueContryNames.entries()) {
    const count = students.filter(({ citizenships: otherCitizenships }) =>
      otherCitizenships.some(({ en: otherCountryName }) => otherCountryName === countryName)
    ).length

    dropdownOptions.push({
      key: countryName,
      value: countryName,
      text: `${country} (${count})`,
      count,
    })
  }

  const sortedDropdownOptions = orderBy(dropdownOptions, ['count', 'text'], ['desc', 'asc'])

  return (
    <Box className="card-content">
      <FormControl fullWidth>
        <InputLabel id="citizenship-select-label">Choose citizenship</InputLabel>
        <Select
          data-cy="citizenshipFilter-dropdown"
          labelId="citizenship-select-label"
          onChange={(event: SelectChangeEvent) => onOptionsChange({ selected: event.target.value })}
          value={selected}
        >
          {sortedDropdownOptions.map(({ key, value, text }) => (
            <MenuItem key={key} value={value}>
              {text}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

export const citizenshipFilter = createFilter({
  key: 'Citizenship',

  title: 'Citizenship',

  defaultOptions: {
    selected: '',
  },

  info: filterToolTips.citizenship,

  isActive: ({ selected }) => !!selected,

  filter(student, { options }) {
    const { selected } = options

    return student.citizenships.some(({ en: countryName }) => countryName === selected)
  },

  render: CitizenshipFilterCard,
})
