import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material'
import { useDispatch } from 'react-redux'

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
  const dispatch = useDispatch()

  const onCourseChange = (event: SelectChangeEvent<string>) => {
    const selectedCourse = event.target.value
    setSelected(selectedCourse)
    dispatch(setSelectedCourse(selectedCourse))
  }

  return (
    <FormControl fullWidth>
      <InputLabel>Select course</InputLabel>
      <Select data-cy="course-selector" label="Select course" onChange={onCourseChange} value={selected}>
        {courses.map(({ key, code, name }) => (
          <MenuItem key={key} value={code}>
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
