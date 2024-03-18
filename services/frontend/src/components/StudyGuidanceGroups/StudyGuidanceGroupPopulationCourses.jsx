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
          filteredStudents={filteredStudents}
          onStudentAmountLimitChange={onStudentAmountLimitChange}
          setCourseTableMode={setCourseTableMode}
          setCurriculum={setCurriculum}
          setStudentAmountLimit={setStudentAmountLimit}
          studentAmountLimit={studentAmountLimit}
          studyProgramme={studyProgramme}
          year={year}
        />
      )}
      {courseTableMode === 'curriculum' ? (
        <PopulationCourseStats courses={courses} filteredStudents={filteredStudents} mandatoryCourses={curriculum} />
      ) : (
        <>
          {!curriculumsAvailable && (
            <Form style={{ padding: '4px 4px 4px 8px' }}>
              <Form.Field inline>
                <label>Limit to courses where student number is at least</label>
                <Input
                  onChange={event => onStudentAmountLimitChange(event.target.value)}
                  style={{ width: '70px' }}
                  value={studentAmountLimit}
                />
              </Form.Field>
            </Form>
          )}
          <PopulationCourseStatsFlat
            courses={courses}
            filteredStudents={filteredStudents}
            pending={false}
            studentAmountLimit={studentAmountLimit}
          />
        </>
      )}
    </Segment>
  )
}
