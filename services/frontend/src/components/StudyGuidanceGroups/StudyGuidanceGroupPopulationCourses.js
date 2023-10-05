import React, { useEffect, useState } from 'react'
import { Segment, Form, Input, Radio } from 'semantic-ui-react'
import PopulationCourseStatsFlat from 'components/PopulationCourseStats/PopulationCourseStatsFlat'
import PopulationCourseStats from 'components/PopulationCourseStats'
import CurriculumPicker from 'components/PopulationDetails/CurriculumPicker'

const StudyGuidanceGroupPopulationCourses = ({
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

const CourseTableModeSelector = ({
  courseTableMode,
  setCourseTableMode,
  year,
  studyProgramme,
  setCurriculum,
  studentAmountLimit,
  setStudentAmountLimit,
  filteredStudents,
  onStudentAmountLimitChange,
}) => {
  useEffect(() => {
    setStudentAmountLimit(Math.round(filteredStudents.length ? filteredStudents.length * 0.3 : 0))
  }, [filteredStudents.length])

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
        <Radio
          style={{ fontWeight: 'bold' }}
          label="Choose curriculum"
          name="coursesRadioGroup"
          value="curriculum"
          onChange={(event, { value }) => setCourseTableMode(value)}
          checked={courseTableMode === 'curriculum'}
        />
        <Radio
          style={{ fontWeight: 'bold' }}
          label="Show all courses with at least"
          name="coursesRadioGroup"
          value="all"
          onChange={(event, { value }) => setCourseTableMode(value)}
          checked={courseTableMode === 'all'}
        />
      </div>
      <div>
        <CurriculumPicker
          year={year}
          programmeCodes={[studyProgramme]}
          setCurriculum={setCurriculum}
          disabled={courseTableMode !== 'curriculum'}
        />
        <Form style={{ padding: '4px 4px 4px 8px' }}>
          <Form.Field inline>
            <Input
              value={studentAmountLimit}
              onChange={e => onStudentAmountLimitChange(e.target.value)}
              disabled={courseTableMode !== 'all'}
              style={{ width: '70px' }}
            />
            <label>total students</label>
          </Form.Field>
        </Form>
      </div>
    </div>
  )
}

export default StudyGuidanceGroupPopulationCourses
