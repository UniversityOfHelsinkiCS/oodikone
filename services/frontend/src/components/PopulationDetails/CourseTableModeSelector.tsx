import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { Dispatch, SetStateAction } from 'react'

import { CurriculumPicker } from '@/components/material/CurriculumPicker'
import { ExtendedCurriculumDetails } from '@/hooks/useCurriculums'
import { CurriculumOption } from '@oodikone/shared/types'

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
}: CourseTableModeSelectorProps) => {
  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setCourseTableMode(event.target.value as typeof courseTableMode)

  return (
    <RadioGroup>
      <Box>
        <FormControlLabel
          control={<Radio checked={courseTableMode === 'curriculum'} onChange={handleRadioChange} size="small" />}
          label={<Typography fontWeight={500}>Choose curriculum</Typography>}
          value={'curriculum'}
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
          control={<Radio checked={courseTableMode === 'all'} onChange={handleRadioChange} size="small" />}
          label={<Typography fontWeight={500}>Select all courses with at least</Typography>}
          value={'all'}
        />
        <TextField
          defaultValue={studentAmountLimit}
          disabled={courseTableMode !== 'all'}
          onChange={({ target }) => onStudentAmountLimitChange(target.value)}
          size="small"
          sx={{ maxWidth: '6em' }}
          type="number"
        />
        <Typography fontWeight={500} sx={{ ml: '1em' }}>
          total students
        </Typography>
      </Stack>
    </RadioGroup>
  )
}
