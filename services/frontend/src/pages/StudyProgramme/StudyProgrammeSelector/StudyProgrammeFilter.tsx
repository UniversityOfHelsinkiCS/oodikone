import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'

import { ProgrammeModuleWithRelevantAttributes } from '@oodikone/shared/types'

export const StudyProgrammeFilter = ({
  handleFilterChange,
  studyProgrammes,
}: {
  handleFilterChange: (value: string) => void
  studyProgrammes: ProgrammeModuleWithRelevantAttributes[]
}) => {
  if (studyProgrammes.length <= 10) {
    return null
  }

  return (
    <TextField
      data-cy="study-programme-filter"
      fullWidth
      label="Filter degree programmes"
      onChange={event => handleFilterChange(event.target.value)}
      placeholder="Type here to filter degree programmes"
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
