import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, func, bool } from 'prop-types'
import { getTranslate } from 'react-localize-redux'
import { Segment, Header } from 'semantic-ui-react'
import qs from 'query-string'
import { getCoursePopulation, getCoursePopulationCourses } from '../../redux/coursePopulation'
import { getCourseStats } from '../../redux/coursestats'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import PopulationCourses from '../PopulationCourseStats'
import infoTooltips from '../../common/InfoToolTips'
import InfoBox from '../InfoBox'
import SegmentDimmer from '../SegmentDimmer'

const CourseStudents = ({ getCoursePopulationDispatch, getCoursePopulationCoursesDispatch, getCourseStatsDispatch, studentData, courses, pending, history, translate, courseData }) => {
  const parseQueryFromUrl = () => {
    const { location } = history
    const query = qs.parse(location.search)
    return query
  }
  const [code, setCode] = useState('')
  const [headerYear, setYear] = useState('')
  useEffect(() => {
    const query = parseQueryFromUrl()
    getCoursePopulationDispatch({ coursecode: query.coursecode, yearcode: query.yearcode })
    getCoursePopulationCoursesDispatch({ coursecode: query.coursecode, yearcode: query.yearcode })
    getCourseStatsDispatch({ fromYear: query.yearcode, toYear: query.yearcode, courseCodes: [query.coursecode], separate: false })
    setCode(query.coursecode)
    setYear(query.year)
  }, [])
  const { CreditAccumulationGraph, CoursesOf } = infoTooltips.PopulationStatistics
  const selectedStudents = studentData.students ? studentData.students.map(student => student.studentNumber) : []
  const header = courseData[code] ? `${courseData[code].name} ${headerYear}` : null
  return (
    <div className="segmentContainer">
      {studentData.students ? (
        <Segment className="contentSegment">
          <Header className="segmentTitle" size="large" textAlign="center">Population of course {header}</Header>
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
      ) : (<div />)}
    </div>
  )
}

CourseStudents.propTypes = {
  getCoursePopulationDispatch: func.isRequired,
  getCoursePopulationCoursesDispatch: func.isRequired,
  getCourseStatsDispatch: func.isRequired,
  pending: bool.isRequired,
  courses: shape([]).isRequired,
  studentData: shape({}).isRequired,
  history: shape({}).isRequired,
  translate: func.isRequired,
  courseData: shape({}).isRequired
}

const mapStateToProps = ({ coursePopulation, locale, courseStats }) => ({
  studentData: coursePopulation.students,
  courses: coursePopulation.courses,
  pending: coursePopulation.pending,
  translate: getTranslate(locale),
  query: coursePopulation.query,
  courseData: courseStats.data
})

export default withRouter(connect(mapStateToProps, { getCoursePopulationDispatch: getCoursePopulation, getCoursePopulationCoursesDispatch: getCoursePopulationCourses, getCourseStatsDispatch: getCourseStats })(CourseStudents))
