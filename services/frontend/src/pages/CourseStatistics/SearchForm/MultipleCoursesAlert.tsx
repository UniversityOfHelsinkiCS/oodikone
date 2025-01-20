import { Alert } from '@mui/material'

export const MultipleCoursesAlert = ({ selectedCourses }: { selectedCourses: number }) => {
  return (
    <Alert severity="warning" variant="outlined">
      <p>
        <b>Notice:</b> Selecting multiple courses may fail if there are too many students in total. If the feature does
        not work, try again with fewer courses.
      </p>
      <p>
        <b>Currently selected: {selectedCourses}</b>
      </p>
    </Alert>
  )
}
