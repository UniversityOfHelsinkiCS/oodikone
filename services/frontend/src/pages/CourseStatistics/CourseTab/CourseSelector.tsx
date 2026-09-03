import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Typography from '@mui/material/Typography'

export const CourseSelector = ({
  courses,
  selected,
  setSelected,
}: {
  courses: { key: string; code: string; name?: string | null; groupId: string }[]
  selected: string
  setSelected: (courseCode: string) => void
}) => {
  const onCourseChange = (event: SelectChangeEvent<string>) => {
    const selectedCourse = event.target.value
    setSelected(selectedCourse)
  }

  return (
    <FormControl fullWidth>
      <InputLabel>Select course</InputLabel>
      <Select data-cy="CourseSelector" label="Select course" onChange={onCourseChange} value={selected}>
        {courses.map(({ key, code, name, groupId }) => (
          <MenuItem data-cy={`CourseSelectorOption${code}`} key={key} value={groupId}>
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
