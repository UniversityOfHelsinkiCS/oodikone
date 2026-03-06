import Paper from '@mui/material/Paper'
import { useState } from 'react'

import { PopulationCourseStats } from '@/components/PopulationCourseStats'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { CourseTableModeSelector } from '@/components/PopulationDetails/CourseTableModeSelector'
import { useDebouncedState } from '@/hooks/debouncedState'
import { StudentAmountLimiter } from '../common/StudentAmountLimiter'

export const StudyGuidanceGroupPopulationCourses = ({
  filteredCourses,
  studyProgramme,
  year,
  curriculum,
  curriculumList,
  setCurriculum,
}) => {
  const [studentAmountLimit, setStudentAmountLimit] = useDebouncedState(0, 1000)
  const curriculumsAvailable = studyProgramme && year
  const [courseTableMode, setCourseTableMode] = useState<'all' | 'curriculum'>(
    curriculumsAvailable ? 'curriculum' : 'all'
  )
  const [showModules, setShowModules] = useState(false) // Shows courses if modules not selected
  const onlyIamRights = false // Show links to courses for everyone

  const onStudentAmountLimitChange = (value: string | number) => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }
  return (
    <Paper sx={{ padding: 2 }}>
      {curriculumsAvailable ? (
        <CourseTableModeSelector
          courseTableMode={courseTableMode}
          curriculum={curriculum}
          curriculumList={curriculumList}
          onStudentAmountLimitChange={onStudentAmountLimitChange}
          setCourseTableMode={setCourseTableMode}
          setCurriculum={setCurriculum}
          studentAmountLimit={studentAmountLimit}
        />
      ) : (
        <StudentAmountLimiter
          onStudentAmountLimitChange={onStudentAmountLimitChange}
          studentAmountLimit={studentAmountLimit}
        />
      )}
      {courseTableMode === 'curriculum' ? (
        <PopulationCourseStats
          courseTableMode={courseTableMode}
          curriculum={curriculum}
          filteredCourses={filteredCourses}
          onlyIamRights={onlyIamRights}
          pending={false}
          setShowModules={setShowModules}
          showModules={showModules}
        />
      ) : (
        <PopulationCourseStatsFlat
          courseTableMode={courseTableMode}
          filteredCourses={filteredCourses}
          onlyIamRights={onlyIamRights}
          setShowModules={setShowModules}
          showModules={showModules}
          studentAmountLimit={studentAmountLimit}
        />
      )}
    </Paper>
  )
}
