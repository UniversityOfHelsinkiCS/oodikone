import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Segment, Button } from 'semantic-ui-react'
import InfoBox from 'components/Info/InfoBox'
import SegmentDimmer from 'components/SegmentDimmer'
import PopulationCourseStatsFlat from 'components/PopulationCourseStats/PopulationCourseStatsFlat'
import PopulationCourseStats from 'components/PopulationCourseStats'
import { getMandatoryCourses } from 'redux/populationMandatoryCourses'
import infotooltips from 'common/InfoToolTips'

const StudyGuidanceGroupPopulationCourses = ({
  courses,
  filteredStudents,
  showStructured,
  toggleShowStructured,
  studyProgramme,
}) => {
  const dispatch = useDispatch()
  const { data: mandatoryCourses, pending } = useSelector(
    ({ populationMandatoryCourses }) => populationMandatoryCourses
  )

  useEffect(() => {
    // ensure mandatory courses are available for course stats structured
    if (showStructured && studyProgramme && mandatoryCourses.length === 0) {
      dispatch(getMandatoryCourses(studyProgramme))
    }
  }, [showStructured])

  return (
    <Segment basic>
      {studyProgramme && showStructured ? (
        <InfoBox content={infotooltips.PopulationStatistics.CoursesOfClass} />
      ) : (
        <InfoBox content={infotooltips.PopulationStatistics.CoursesOfPopulation} />
      )}
      {studyProgramme && (
        <Button primary onClick={() => toggleShowStructured()} style={{ marginLeft: '1em' }}>
          {showStructured ? 'Show courses as flat list' : 'Show by programme structure'}
        </Button>
      )}
      {showStructured ? (
        <PopulationCourseStats courses={courses} pending={false} filteredStudents={filteredStudents} />
      ) : (
        <PopulationCourseStatsFlat courses={courses} pending={false} filteredStudents={filteredStudents} />
      )}
      {pending && <SegmentDimmer isLoading={pending} />}
    </Segment>
  )
}
export default StudyGuidanceGroupPopulationCourses
