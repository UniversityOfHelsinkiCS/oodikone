import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Segment, Button } from 'semantic-ui-react'
import InfoBox from 'components/Info/InfoBox'
import PopulationCourseStatsFlat from 'components/PopulationCourseStats/PopulationCourseStatsFlat'
import PopulationCourseStats from 'components/PopulationCourseStats'
import useCourseFilter from 'components/FilterTray/filters/Courses/useCourseFilter'
import SegmentDimmer from 'components/SegmentDimmer'
import { useGetStudyGuidanceGroupPopulationCoursesQuery } from 'redux/studyGuidanceGroups'
import { getMandatoryCourses, getMandatoryCourseModules } from 'redux/populationMandatoryCourses'
import infotooltips from 'common/InfoToolTips'

const StudyGuidanceGroupPopulationCourses = ({
  selectedStudents,
  showStructured,
  toggleShowStructured,
  studyProgramme,
}) => {
  const { setCourses, resetCourses } = useCourseFilter()
  const dispatch = useDispatch()
  const mandatoryCourses = useSelector(({ populationMandatoryCourses }) => populationMandatoryCourses.data)
  const { data: courses, isLoading } = useGetStudyGuidanceGroupPopulationCoursesQuery(selectedStudents)

  useEffect(() => {
    // ensure mandatory courses are available for course stats structured
    if (showStructured && studyProgramme && mandatoryCourses.length === 0) {
      dispatch(getMandatoryCourses(studyProgramme))
      dispatch(getMandatoryCourseModules(studyProgramme))
    }
  }, [showStructured])

  useEffect(() => {
    if (!isLoading) setCourses(courses.coursestatistics)
  }, [courses])

  useEffect(() => {
    return resetCourses
  }, [])

  if (isLoading) return <SegmentDimmer isLoading={isLoading} />
  return (
    <Segment basic>
      <InfoBox content={infotooltips.PopulationStatistics.CoursesOfPopulation} />
      {studyProgramme && (
        <Button primary onClick={() => toggleShowStructured()} style={{ marginLeft: '1em' }}>
          {showStructured ? 'Show courses as flat list' : 'Show by programme structure'}
        </Button>
      )}
      {showStructured ? (
        <PopulationCourseStats courses={courses} pending={isLoading} selectedStudents={selectedStudents} />
      ) : (
        <PopulationCourseStatsFlat
          courses={courses}
          pending={isLoading}
          selectedStudents={selectedStudents}
          showFilter={false}
        />
      )}
    </Segment>
  )
}
export default StudyGuidanceGroupPopulationCourses
