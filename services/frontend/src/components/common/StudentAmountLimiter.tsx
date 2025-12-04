import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { NumericTextField } from './NumericTextField'

export const StudentAmountLimiter = ({
  onStudentAmountLimitChange,
  studentAmountLimit,
}: {
  onStudentAmountLimitChange: (value: string | number) => void
  studentAmountLimit: number
}) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
    <Typography fontWeight={500}>Show all courses with at least</Typography>
    <NumericTextField
      initialValue={studentAmountLimit}
      onChange={({ target }) => onStudentAmountLimitChange(target.value)}
    />
    <Typography fontWeight={500}>total students</Typography>
  </Stack>
)
