import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, func, bool, arrayOf, string } from 'prop-types'
import { getTranslate } from 'react-localize-redux'
import { Segment, Header, Loader } from 'semantic-ui-react'
import qs from 'query-string'
import { intersection, difference } from 'lodash'
import { getCoursePopulation, getCoursePopulationCourses } from '../../redux/coursePopulation'
import { getSingleCourseStats } from '../../redux/singleCourseStats'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import CourseStudentCourses from '../CourseStudentCourses'
import infoTooltips from '../../common/InfoToolTips'
import InfoBox from '../InfoBox'
import SegmentDimmer from '../SegmentDimmer'
import CourseStudentsFilters from '../CourseStudentsFilters'

const CourseStudents = ({
  getCoursePopulationDispatch,
  getCoursePopulationCoursesDispatch,
  getSingleCourseStatsDispatch,
  studentData,
  pending,
  history,
  translate,
  courseData,
  selectedStudents }) => {
  const parseQueryFromUrl = () => {
    const { location } = history
    const query = qs.parse(location.search)
    return query
  }
  const [codes, setCodes] = useState('')
  const [headerYear, setYear] = useState('')
  const [yearCode, setYearCode] = useState('')
  useEffect(() => {
    const query = parseQueryFromUrl()
    getCoursePopulationDispatch({ coursecodes: query.coursecodes, yearcode: query.yearcode })
    getCoursePopulationCoursesDispatch({ coursecodes: query.coursecodes, yearcode: query.yearcode })
    getSingleCourseStatsDispatch({ fromYear: query.yearcode, toYear: query.yearcode, courseCodes: query.coursecodes, separate: false })
    setCodes(query.coursecodes)
    setYearCode(query.yearcode)
    setYear(query.year)
  }, [])

  const { CreditAccumulationGraph, CoursesOf } = infoTooltips.PopulationStatistics
  const header = courseData ? `${courseData.name} ${headerYear}` : null

  return (
    <div className="segmentContainer">
      {studentData.students && !pending ? (
        <Segment className="contentSegment">
          <Header className="segmentTitle" size="large" textAlign="center">Population of course {header}</Header>
          <CourseStudentsFilters samples={studentData.students} coursecodes={codes} />
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
            <CourseStudentCourses
              selectedStudents={selectedStudents}
              codes={codes}
              yearCode={yearCode}
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
    pending: coursePopulation.pending,
    translate: getTranslate(localize),
    query: coursePopulation.query,
    courseData: singleCourseStats.stats,
    selectedStudents
  })
}

export default withRouter(connect(mapStateToProps, {
  getCoursePopulationDispatch: getCoursePopulation,
  getCoursePopulationCoursesDispatch: getCoursePopulationCourses,
  getSingleCourseStatsDispatch: getSingleCourseStats
})(CourseStudents))
