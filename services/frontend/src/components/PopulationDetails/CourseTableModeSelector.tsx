import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Dispatch, SetStateAction } from 'react'

import { CurriculumPicker } from '@/components/common/CurriculumPicker'
import { ExtendedCurriculumDetails } from '@/hooks/useCurriculums'
import { CurriculumOption } from '@oodikone/shared/types'
import { StudentAmountLimiter } from '../common/StudentAmountLimiter'

type CourseTableModeSelectorProps = {
  courseTableMode: 'curriculum' | 'all'
  setCourseTableMode: Dispatch<SetStateAction<'curriculum' | 'all'>>
  curriculum: ExtendedCurriculumDetails | null
  curriculumList: CurriculumOption[]
  setCurriculum: Dispatch<SetStateAction<CurriculumOption | null>>
  studentAmountLimit: number
  onStudentAmountLimitChange: (input: string) => void
}

export const CourseTableModeSelector = ({
  courseTableMode,
  onStudentAmountLimitChange,
  setCourseTableMode,
  curriculum,
  curriculumList,
  setCurriculum,
  studentAmountLimit,
}: CourseTableModeSelectorProps) => (
  <RadioGroup>
    <Box>
      <FormControlLabel
        control={
          <Radio
            checked={courseTableMode === 'curriculum'}
            onChange={() => setCourseTableMode('curriculum')}
            size="small"
          />
        }
        label={<Typography fontWeight={500}>Choose curriculum</Typography>}
      />
      <CurriculumPicker
        curriculum={curriculum}
        curriculumList={curriculumList}
        disabled={courseTableMode !== 'curriculum'}
        setCurriculum={setCurriculum}
      />
    </Box>
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
