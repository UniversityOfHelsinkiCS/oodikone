import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Typography from '@mui/material/Typography'

import { useAppDispatch } from '@/redux/hooks'

import { setSelectedCourse } from '@/redux/selectedCourse'

export const CourseSelector = ({
  courses,
  selected,
  setSelected,
}: {
  courses: { key: string; code: string; name: string }[]
  selected: string
  setSelected: (courseCode: string) => void
}) => {
  const dispatch = useAppDispatch()

  const onCourseChange = (event: SelectChangeEvent<string>) => {
    const selectedCourse = event.target.value
    setSelected(selectedCourse)
    dispatch(setSelectedCourse(selectedCourse))
  }

  return (
    <FormControl fullWidth>
      <InputLabel>Select course</InputLabel>
      <Select data-cy="CourseSelector" label="Select course" onChange={onCourseChange} value={selected}>
        {courses.map(({ key, code, name }) => (
          <MenuItem data-cy={`CourseSelectorOption${code}`} key={key} value={code}>
            <Box display="flex" justifyContent="space-between" width="100%">
              <Typography color="text.primary" component="span" variant="body1">
                {name}
              </Typography>
              <Typography color="text.secondary" component="span" variant="body1">
                {code}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
