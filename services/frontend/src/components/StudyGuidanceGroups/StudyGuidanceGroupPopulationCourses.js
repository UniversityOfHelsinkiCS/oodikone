import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
// import { Segment, Button, Form, Input } from 'semantic-ui-react'
import { Segment, Form, Input } from 'semantic-ui-react'
import InfoBox from 'components/Info/InfoBox'
import SegmentDimmer from 'components/SegmentDimmer'
import PopulationCourseStatsFlat from 'components/PopulationCourseStats/PopulationCourseStatsFlat'
// import PopulationCourseStats from 'components/PopulationCourseStats'
import { getMandatoryCourses } from 'redux/populationMandatoryCourses'
import infotooltips from 'common/InfoToolTips'

const StudyGuidanceGroupPopulationCourses = ({
  courses,
  filteredStudents,
  showStructured,
  // toggleShowStructured,
  studyProgramme,
}) => {
  const dispatch = useDispatch()
  const { data: mandatoryCourses, pending } = useSelector(
    ({ populationMandatoryCourses }) => populationMandatoryCourses
  )
  const [studentAmountLimit, setStudentAmountLimit] = useState(0)

  useEffect(() => {
    setStudentAmountLimit(Math.round(filteredStudents.length ? filteredStudents.length * 0.3 : 0))
  }, [filteredStudents.length])

  const onStudentAmountLimitChange = value => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }

  useEffect(() => {
    // ensure mandatory courses are available for course stats structured
    if (showStructured && studyProgramme && !mandatoryCourses?.defaultProgrammeCourses) {
      dispatch(getMandatoryCourses(studyProgramme))
    }
  }, [showStructured])

  // Button to toggle between flat list and programme structure view has been removed as an emergency fix

  return (
    <Segment basic>
      {studyProgramme && showStructured ? (
        <InfoBox content={infotooltips.PopulationStatistics.CoursesOfClass} />
      ) : (
        <InfoBox content={infotooltips.PopulationStatistics.CoursesOfPopulation} />
      )}
      {/* {studyProgramme && (
        <Button primary onClick={() => toggleShowStructured()} style={{ marginLeft: '1em' }}>
          {showStructured ? 'Show courses as flat list' : 'Show by programme structure'}
        </Button>
      )} */}
      {/* {showStructured ? (
        <PopulationCourseStats courses={courses} pending={false} filteredStudents={filteredStudents} />
      ) : ( */}
      <>
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
        <PopulationCourseStatsFlat
          courses={courses}
          pending={false}
          filteredStudents={filteredStudents}
          studentAmountLimit={studentAmountLimit}
        />
      </>
      {/* )} */}
      {pending && <SegmentDimmer isLoading={pending} />}
    </Segment>
  )
}
export default StudyGuidanceGroupPopulationCourses
