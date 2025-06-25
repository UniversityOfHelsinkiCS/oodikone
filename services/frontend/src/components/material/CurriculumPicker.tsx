import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

import { CurriculumOption } from '@oodikone/shared/types'

export const CurriculumPicker = ({
  disabled = false,
  curriculum,
  curriculumList,
  setCurriculum,
}: {
  disabled?: boolean
  curriculum: CurriculumOption | null
  curriculumList: CurriculumOption[]
  setCurriculum: (curriculum?: CurriculumOption) => void
}) => {
  if (!curriculumList.length || !curriculum) return null

  return (
    <FormControl disabled={disabled} variant="standard">
      <Select
        MenuProps={{
          disablePortal: true,
        }}
        data-cy="curriculum-picker"
        onChange={event => setCurriculum(curriculumList.find(({ id }) => id === event.target.value))}
        value={curriculum.id}
      >
        {curriculumList.map(({ id, name }) => (
          <MenuItem key={id} value={id}>
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
