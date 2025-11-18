import Paper from '@mui/material/Paper'
import { useState } from 'react'

import { PopulationCourseStats } from '@/components/PopulationCourseStats'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { CourseTableModeSelector } from '@/components/PopulationDetails/CourseTableModeSelector'
import { useDebouncedState } from '@/hooks/debouncedState'
import { StudentAmountLimiter } from '../common/StudentAmountLimiter'

export const StudyGuidanceGroupPopulationCourses = ({
  filteredCourses,
  filteredStudents,
  studyProgramme,
  year,
  curriculum,
  curriculumList,
  setCurriculum,
}) => {
  const [studentAmountLimit, setStudentAmountLimit] = useDebouncedState(0, 1000)
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
        <StudentAmountLimiter
          onStudentAmountLimitChange={onStudentAmountLimitChange}
          studentAmountLimit={studentAmountLimit}
        />
      )}
      {courseTableMode === 'curriculum' ? (
        <PopulationCourseStats curriculum={curriculum} filteredCourses={filteredCourses} />
      ) : (
        <PopulationCourseStatsFlat filteredCourses={filteredCourses} studentAmountLimit={studentAmountLimit} />
      )}
    </Paper>
  )
}
