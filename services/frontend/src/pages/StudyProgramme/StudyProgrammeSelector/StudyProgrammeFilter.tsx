import { Search as SearchIcon } from '@mui/icons-material'
import { InputAdornment, TextField } from '@mui/material'

import { DegreeProgramme } from '@/types/api/faculty'

export const StudyProgrammeFilter = ({
  handleFilterChange,
  studyProgrammes,
}: {
  handleFilterChange: (value: string) => void
  studyProgrammes: DegreeProgramme[]
}) => {
  if (studyProgrammes.length <= 10) {
    return null
  }

  return (
    <TextField
      data-cy="study-programme-filter"
      fullWidth
      label="Filter study programmes"
      onChange={event => handleFilterChange(event.target.value)}
      placeholder="Type here to filter study programmes"
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <SearchIcon />
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
