import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'

export const MultipleCoursesAlert = ({ selectedCourses }: { selectedCourses: number }) => (
  <Alert severity="info" sx={{ p: 1.5 }}>
    <Typography sx={{ mb: 1 }}>
      <b>Notice:</b> Fetching statistics for multiple courses may fail if there are too many students in total. If the
      query fails, try again with fewer courses.
    </Typography>
    <Typography fontWeight="bold">Currently selected: {selectedCourses}</Typography>
  </Alert>
)
