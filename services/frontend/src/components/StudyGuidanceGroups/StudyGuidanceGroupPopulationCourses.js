import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Segment, Button } from 'semantic-ui-react'
import InfoBox from 'components/Info/InfoBox'
import PopulationCourseStatsFlat from 'components/PopulationCourseStats/PopulationCourseStatsFlat'
import PopulationCourseStats from 'components/PopulationCourseStats'
import { useGetStudyGuidanceGroupPopulationCoursesQuery } from 'redux/studyGuidanceGroups'
import { getMandatoryCourses, getMandatoryCourseModules } from 'redux/populationMandatoryCourses'
import infotooltips from 'common/InfoToolTips'

const StudyGuidanceGroupPopulationCourses = ({
  courses,
  selectedStudents,
  showStructured,
  toggleShowStructured,
  studyProgramme,
}) => {
  const dispatch = useDispatch()
  const mandatoryCourses = useSelector(({ populationMandatoryCourses }) => populationMandatoryCourses.data)

  useEffect(() => {
    // ensure mandatory courses are available for course stats structured
    if (showStructured && studyProgramme && mandatoryCourses.length === 0) {
      dispatch(getMandatoryCourses(studyProgramme))
      dispatch(getMandatoryCourseModules(studyProgramme))
    }
  }, [showStructured])

  return (
    <Segment basic>
      <InfoBox content={infotooltips.PopulationStatistics.CoursesOfPopulation} />
      {studyProgramme && (
        <Button primary onClick={() => toggleShowStructured()} style={{ marginLeft: '1em' }}>
          {showStructured ? 'Show courses as flat list' : 'Show by programme structure'}
        </Button>
      )}
      {showStructured ? (
        <PopulationCourseStats courses={courses} pending={false} selectedStudents={selectedStudents} />
      ) : (
        <PopulationCourseStatsFlat
          courses={courses}
          pending={false}
          selectedStudents={selectedStudents}
          showFilter={false}
        />
      )}
    </Segment>
  )
}
export default StudyGuidanceGroupPopulationCourses
