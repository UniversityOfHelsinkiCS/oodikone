import { useState } from 'react'
import { Form, Input, Segment } from 'semantic-ui-react'

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
    <Segment basic>
      {curriculumsAvailable && (
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
      )}
      {courseTableMode === 'curriculum' ? (
        <PopulationCourseStats curriculum={curriculum} filteredCourses={filteredCourses} />
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
          <PopulationCourseStatsFlat filteredCourses={filteredCourses} studentAmountLimit={studentAmountLimit} />
        </>
      )}
    </Segment>
  )
}
