import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, func, bool, arrayOf } from 'prop-types'
import { getTranslate } from 'react-localize-redux'
import { Segment, Header } from 'semantic-ui-react'
import qs from 'query-string'
import { intersection, difference } from 'lodash'
import { getCoursePopulation, getCoursePopulationCourses } from '../../redux/coursePopulation'
import { getCourseStats } from '../../redux/coursestats'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import PopulationCourses from '../PopulationCourseStats'
import infoTooltips from '../../common/InfoToolTips'
import InfoBox from '../InfoBox'
import SegmentDimmer from '../SegmentDimmer'
import CourseStudentsFilters from '../CourseStudentsFilters'

const CourseStudents = ({ getCoursePopulationDispatch, getCoursePopulationCoursesDispatch, getCourseStatsDispatch, studentData, courses, pending, history, translate, courseData, selectedStudents }) => {
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
  const header = courseData[code] ? `${courseData[code].name} ${headerYear}` : null
  return (
    <div className="segmentContainer">
      {studentData.students ? (
        <Segment className="contentSegment">
          <Header className="segmentTitle" size="large" textAlign="center">Population of course {header}</Header>
          <CourseStudentsFilters samples={studentData.students} />
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
  courseData: shape({}).isRequired,
  selectedStudents: arrayOf(shape([])).isRequired
}

const mapStateToProps = ({ coursePopulation, localize, courseStats, populationFilters }) => {
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
    courseData: courseStats.data,
    selectedStudents
  })
}

export default withRouter(connect(mapStateToProps, { getCoursePopulationDispatch: getCoursePopulation, getCoursePopulationCoursesDispatch: getCoursePopulationCourses, getCourseStatsDispatch: getCourseStats })(CourseStudents))
