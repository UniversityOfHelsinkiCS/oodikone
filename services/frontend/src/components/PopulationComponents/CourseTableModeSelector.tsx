import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Dispatch, SetStateAction } from 'react'

import { StudentAmountLimiter } from '@/components/common/StudentAmountLimiter'
import { ExtendedCurriculumDetails } from '@/hooks/useCurriculums'

type CourseTableModeSelectorProps = {
  courseTableMode: 'curriculum' | 'all'
  setCourseTableMode: Dispatch<SetStateAction<'curriculum' | 'all'>>
  curriculum: ExtendedCurriculumDetails | null
  studentAmountLimit: number
  onStudentAmountLimitChange: (input: string) => void
}

export const CourseTableModeSelector = ({
  courseTableMode,
  onStudentAmountLimitChange,
  setCourseTableMode,
  curriculum,
  studentAmountLimit,
}: CourseTableModeSelectorProps) => (
  <RadioGroup>
    <FormControlLabel
      control={
        <Radio
          checked={courseTableMode === 'curriculum'}
          onChange={() => setCourseTableMode('curriculum')}
          size="small"
        />
      }
      label={
        <Stack flexDirection="row" gap={1} sx={{ alignContent: 'center' }}>
          <Typography fontWeight={500}>Curriculum</Typography>
          <Typography
            fontWeight={800}
            sx={{
              color: courseTableMode === 'curriculum' ? 'text.primary' : 'text.disabled',
            }}
          >
            {curriculum?.name ?? 'unavailable'}
          </Typography>
        </Stack>
      }
    />
    <Stack direction="row" sx={{ alignItems: 'center', mt: '0.5em' }}>
      <FormControlLabel
        control={
          <>
            <Radio checked={courseTableMode === 'all'} onChange={() => setCourseTableMode('all')} size="small" />
            <StudentAmountLimiter
              disabled={courseTableMode !== 'all'}
              onStudentAmountLimitChange={value => onStudentAmountLimitChange(value.toString())}
              studentAmountLimit={studentAmountLimit}
            />
          </>
        }
        label=""
        value={'all'}
      />
    </Stack>
  </RadioGroup>
)
