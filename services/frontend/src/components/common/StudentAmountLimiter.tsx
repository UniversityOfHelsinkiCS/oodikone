import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { NumericTextField } from './NumericTextField'

export const StudentAmountLimiter = ({
  onStudentAmountLimitChange,
  studentAmountLimit,
  disabled = false,
  showModules = false,
}: {
  onStudentAmountLimitChange: (value: string | number) => void
  studentAmountLimit: number
  showModules?: boolean
  disabled?: boolean
}) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
    <Typography fontWeight={500}>Show all {showModules ? 'modules' : 'courses'} with at least</Typography>
    <NumericTextField
      disabled={disabled}
      initialValue={studentAmountLimit}
      onChange={({ target }) => onStudentAmountLimitChange(target.value)}
    />
    <Typography fontWeight={500}>total students</Typography>
  </Stack>
)
