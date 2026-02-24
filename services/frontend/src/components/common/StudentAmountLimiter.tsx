import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { NumericTextField } from './NumericTextField'

export const StudentAmountLimiter = ({
  onStudentAmountLimitChange,
  studentAmountLimit,
  disabled = false,
}: {
  onStudentAmountLimitChange: (value: string | number) => void
  studentAmountLimit: number
  disabled?: boolean
}) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
    <Typography fontWeight={500}>Show all courses or modules with at least</Typography>
    <NumericTextField
      disabled={disabled}
      initialValue={studentAmountLimit}
      onChange={({ target }) => onStudentAmountLimitChange(target.value)}
    />
    <Typography fontWeight={500}>total students</Typography>
  </Stack>
)
