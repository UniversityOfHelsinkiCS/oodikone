import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

export const StudentAmountLimiter = ({ onStudentAmountLimitChange, studentAmountLimit }) => (
  <Stack direction="row" sx={{ alignItems: 'center', mt: '0.5em' }}>
    <Typography fontWeight={500}>Select all courses with at least</Typography>
    <TextField
      onChange={({ target }) => onStudentAmountLimitChange(target.value)}
      size="small"
      sx={{ maxWidth: '6em' }}
      type="number"
      value={studentAmountLimit}
    />
    <Typography fontWeight={500} sx={{ ml: '1em' }}>
      total students
    </Typography>
  </Stack>
)
