import React, { useState } from 'react'
import { Segment, Form, Input } from 'semantic-ui-react'

import { ConnectedPopulationCourseStats as PopulationCourseStats } from '@/components/PopulationCourseStats'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { CourseTableModeSelector } from '@/components/PopulationDetails/CurriculumPicker'

export const StudyGuidanceGroupPopulationCourses = ({
  courses,
  filteredStudents,
  studyProgramme,
  year,
  curriculum,
  setCurriculum,
}) => {
  const [studentAmountLimit, setStudentAmountLimit] = useState(0)
  const curriculumsAvailable = studyProgramme && year
  const [courseTableMode, setCourseTableMode] = useState(curriculumsAvailable ? 'curriculum' : 'all')
  const onStudentAmountLimitChange = value => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }
  return (
    <Segment basic>
      {curriculumsAvailable && (
        <CourseTableModeSelector
          courseTableMode={courseTableMode}
          setCourseTableMode={setCourseTableMode}
          year={year}
          studyProgramme={studyProgramme}
          setCurriculum={setCurriculum}
          studentAmountLimit={studentAmountLimit}
          setStudentAmountLimit={setStudentAmountLimit}
          filteredStudents={filteredStudents}
          onStudentAmountLimitChange={onStudentAmountLimitChange}
        />
      )}
      {courseTableMode === 'curriculum' ? (
        <PopulationCourseStats mandatoryCourses={curriculum} courses={courses} filteredStudents={filteredStudents} />
      ) : (
        <>
          {!curriculumsAvailable && (
            <Form style={{ padding: '4px 4px 4px 8px' }}>
              <Form.Field inline>
                <label>Limit to courses where student number is at least</label>
                <Input
                  value={studentAmountLimit}
                  onChange={e => onStudentAmountLimitChange(e.target.value)}
                  style={{ width: '70px' }}
                />
              </Form.Field>
            </Form>
          )}
          <PopulationCourseStatsFlat
            courses={courses}
            pending={false}
            filteredStudents={filteredStudents}
            studentAmountLimit={studentAmountLimit}
          />
        </>
      )}
    </Segment>
  )
}
