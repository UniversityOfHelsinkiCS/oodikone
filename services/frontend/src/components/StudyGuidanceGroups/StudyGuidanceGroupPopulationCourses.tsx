import { useState } from 'react'

import { CourseTableModeSelector } from '@/components/PopulationComponents/CourseTableModeSelector'
import { PopulationCourseStats } from '@/components/PopulationCourseStats'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { useDebouncedState } from '@/hooks/debouncedState'
import { StudentAmountLimiter } from '../common/StudentAmountLimiter'

export const StudyGuidanceGroupPopulationCourses = ({ filteredCourses, studyProgramme, year, curriculum }) => {
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
    <>
      {curriculumsAvailable ? (
        <CourseTableModeSelector
          courseTableMode={courseTableMode}
          curriculum={curriculum}
          onStudentAmountLimitChange={onStudentAmountLimitChange}
          setCourseTableMode={setCourseTableMode}
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
    </>
  )
}
