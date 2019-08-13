import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, func, bool, arrayOf, string } from 'prop-types'
import { getTranslate } from 'react-localize-redux'
import { Segment, Header, Loader } from 'semantic-ui-react'
import qs from 'query-string'
import { intersection, difference } from 'lodash'
import { getCoursePopulation, getCoursePopulationCourses, getCoursePopulationCoursesByStudentnumbers } from '../../redux/coursePopulation'
import { getSingleCourseStats } from '../../redux/singleCourseStats'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import PopulationCourses from '../PopulationCourseStats'
import infoTooltips from '../../common/InfoToolTips'
import InfoBox from '../InfoBox'
import SegmentDimmer from '../SegmentDimmer'
import CourseStudentsFilters from '../CourseStudentsFilters'
import { refreshFilters } from '../../redux/populationFilters'

const CourseStudents = ({
  getCoursePopulationDispatch,
  getCoursePopulationCoursesDispatch,
  getSingleCourseStatsDispatch,
  studentData,
  courses,
  pending,
  history,
  translate,
  courseData,
  selectedStudents,
  refreshNeeded,
  getCoursePopulationCoursesByStudentnumbersDispatch,
  dispatchRefreshFilters }) => {
  const parseQueryFromUrl = () => {
    const { location } = history
    const query = qs.parse(location.search)
    return query
  }
  const [code, setCode] = useState('')
  const [headerYear, setYear] = useState('')
  const [yearCode, setYearCode] = useState('')
  useEffect(() => {
    const query = parseQueryFromUrl()
    getCoursePopulationDispatch({ coursecode: query.coursecode, yearcode: query.yearcode })
    getCoursePopulationCoursesDispatch({ coursecode: query.coursecode, yearcode: query.yearcode })
    getSingleCourseStatsDispatch({ fromYear: query.yearcode, toYear: query.yearcode, courseCodes: [query.coursecode], separate: false })
    setCode(query.coursecode)
    setYearCode(query.yearcode)
    setYear(query.year)
  }, [])

  const reloadCourses = () => {
    dispatchRefreshFilters()
    getCoursePopulationCoursesByStudentnumbersDispatch({ coursecode: code, yearcode: yearCode, studentnumberlist: selectedStudents })
  }

  useEffect(() => {
    if (refreshNeeded) {
      reloadCourses()
    }
  }, [refreshNeeded])

  const { CreditAccumulationGraph, CoursesOf } = infoTooltips.PopulationStatistics
  const header = courseData ? `${courseData.name} ${headerYear}` : null

  return (
    <div className="segmentContainer">
      {studentData.students && !pending ? (
        <Segment className="contentSegment">
          <Header className="segmentTitle" size="large" textAlign="center">Population of course {header}</Header>
          <CourseStudentsFilters samples={studentData.students} coursecode={code} />
          <Segment>
            <Header size="medium" dividing>
              {translate('populationStatistics.graphSegmentHeader')} (for {selectedStudents.length} students)
              <InfoBox content={CreditAccumulationGraph} />
            </Header>
            <CreditAccumulationGraphHighCharts
              students={studentData.students}
              selectedStudents={selectedStudents}
              title={`${translate('populationStatistics.sampleId')}`}
              translate={translate}

            />
          </Segment>
          <Segment>
            <Header size="medium" dividing >
              <Header.Content>{translate('populationCourses.header')}</Header.Content>
              <InfoBox content={CoursesOf} />
            </Header>
            <SegmentDimmer translate={translate} isLoading={pending} />
            <PopulationCourses
              courses={courses}
              pending={pending}
              selectedStudents={selectedStudents}
            />
          </Segment>
          <PopulationStudents
            samples={studentData.students}
            selectedStudents={selectedStudents}
          />
        </Segment>
      ) : (<Loader active={pending} inline="centered" />)}
    </div>
  )
}

CourseStudents.propTypes = {
  getCoursePopulationDispatch: func.isRequired,
  getCoursePopulationCoursesDispatch: func.isRequired,
  getSingleCourseStatsDispatch: func.isRequired,
  pending: bool.isRequired,
  courses: shape([]).isRequired,
  studentData: shape({}).isRequired,
  history: shape({}).isRequired,
  translate: func.isRequired,
  courseData: shape({}).isRequired,
  selectedStudents: arrayOf(string).isRequired
}

const mapStateToProps = ({ coursePopulation, localize, singleCourseStats, populationFilters }) => {
  const samples = coursePopulation.students.students ? coursePopulation.students.students : []
  let selectedStudents = samples.length > 0 ? samples.map(s => s.studentNumber) : []
  const { complemented } = populationFilters

  if (samples.length > 0 && populationFilters.filters.length > 0) {
    const studentsForFilter = (f) => {
      if (f.type === 'CourseParticipation') {
        return Object.keys(f.studentsOfSelectedField)
      }
      return samples.filter(f.filter).map(s => s.studentNumber)
    }

    const matchingStudents = populationFilters.filters.map(studentsForFilter)
    selectedStudents = intersection(...matchingStudents)

    if (complemented) {
      selectedStudents = difference(samples.map(s => s.studentNumber), selectedStudents)
    }
  }
  return ({
    studentData: coursePopulation.students,
    courses: coursePopulation.courses,
    pending: coursePopulation.pending,
    translate: getTranslate(localize),
    query: coursePopulation.query,
    courseData: singleCourseStats.stats,
    selectedStudents,
    refreshNeeded: populationFilters.refreshNeeded
  })
}

export default withRouter(connect(mapStateToProps, {
  getCoursePopulationDispatch: getCoursePopulation,
  getCoursePopulationCoursesDispatch: getCoursePopulationCourses,
  getSingleCourseStatsDispatch: getSingleCourseStats,
  dispatchRefreshFilters: refreshFilters,
  getCoursePopulationCoursesByStudentnumbersDispatch: getCoursePopulationCoursesByStudentnumbers
})(CourseStudents))
