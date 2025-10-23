import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'

import { PopulationCourseStats } from '@/components/PopulationCourseStats'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { CourseTableModeSelector } from '@/components/PopulationDetails/CourseTableModeSelector'

export const StudyGuidanceGroupPopulationCourses = ({
  filteredCourses,
  filteredStudents,
  studyProgramme,
  year,
  curriculum,
  curriculumList,
  setCurriculum,
}) => {
  const [studentAmountLimit, setStudentAmountLimit] = useState(0)
  const curriculumsAvailable = studyProgramme && year
  const [courseTableMode, setCourseTableMode] = useState(curriculumsAvailable ? 'curriculum' : 'all')
  const onStudentAmountLimitChange = value => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }
  return (
    <Paper sx={{ padding: 2 }}>
      {curriculumsAvailable ? (
        <CourseTableModeSelector
          courseTableMode={courseTableMode}
          curriculum={curriculum}
          curriculumList={curriculumList}
          filteredStudents={filteredStudents}
          onStudentAmountLimitChange={onStudentAmountLimitChange}
          setCourseTableMode={setCourseTableMode}
          setCurriculum={setCurriculum}
          setStudentAmountLimit={setStudentAmountLimit}
          studentAmountLimit={studentAmountLimit}
        />
      ) : (
        // FIXME:TODO: This is ripped off from CourseTableModeSelector
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
      )}
      {courseTableMode === 'curriculum' ? (
        <PopulationCourseStats curriculum={curriculum} filteredCourses={filteredCourses} />
      ) : (
        <PopulationCourseStatsFlat filteredCourses={filteredCourses} studentAmountLimit={studentAmountLimit} />
      )}
    </Paper>
  )
}
