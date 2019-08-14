import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { func, shape, arrayOf, string, bool } from 'prop-types'
import { Segment, Header, Popup } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'

import SegmentDimmer from '../SegmentDimmer'
import PopulationCourseStats from '../PopulationCourseStats'
import { refreshFilters } from '../../redux/populationFilters'
import { getCoursePopulation, getCoursePopulationCourses, getCoursePopulationCoursesByStudentnumbers } from '../../redux/coursePopulation'
import { getSingleCourseStats } from '../../redux/singleCourseStats'

const CourseStudentCourses = ({
  refreshNeeded,
  dispatchRefreshFilters,
  translate,
  courses,
  pending,
  selectedStudents,
  getCoursePopulationCoursesByStudentnumbersDispatch,
  code,
  yearCode,
  query
}) => {
  const reloadCourses = () => {
    dispatchRefreshFilters()
    getCoursePopulationCoursesByStudentnumbersDispatch({ coursecode: code, yearcode: yearCode, studentnumberlist: selectedStudents })
  }

  useEffect(() => {
    if (refreshNeeded) {
      reloadCourses()
    }
  }, [refreshNeeded])

  return (
    <Segment>
      <Header size="medium" dividing >
        <Popup
          trigger={<Header.Content>{translate('populationCourses.header')}</Header.Content>}
          content="Sort by clicking columns. Click course name to limit observed population to students who
            participated to the course."
          wide
          position="top left"
        />
      </Header>
      <SegmentDimmer translate={translate} isLoading={pending} />
      <PopulationCourseStats
        courses={courses}
        query={query}
        pending={pending}
        selectedStudents={selectedStudents}
      />
    </Segment>
  )
}

CourseStudentCourses.propTypes = {
  pending: bool.isRequired,
  courses: shape([]).isRequired,
  translate: func.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  refreshNeeded: bool.isRequired,
  getCoursePopulationCoursesByStudentnumbersDispatch: func.isRequired,
  dispatchRefreshFilters: func.isRequired,
  code: string.isRequired,
  yearCode: string.isRequired,
  query: shape({}).isRequired
}

const mapStateToProps = ({ coursePopulation, localize, singleCourseStats, populationFilters }) => ({
  studentData: coursePopulation.students,
  courses: coursePopulation.courses,
  pending: coursePopulation.coursesPending,
  translate: getTranslate(localize),
  query: coursePopulation.query,
  courseData: singleCourseStats.stats,
  refreshNeeded: populationFilters.refreshNeeded
})

export default connect(mapStateToProps, {
  getCoursePopulationDispatch: getCoursePopulation,
  getCoursePopulationCoursesDispatch: getCoursePopulationCourses,
  getSingleCourseStatsDispatch: getSingleCourseStats,
  dispatchRefreshFilters: refreshFilters,
  getCoursePopulationCoursesByStudentnumbersDispatch: getCoursePopulationCoursesByStudentnumbers
})(CourseStudentCourses)
