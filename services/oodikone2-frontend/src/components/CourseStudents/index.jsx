import React, { useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, func, bool } from 'prop-types'
import { getTranslate } from 'react-localize-redux'
import { Segment, Header, Popup } from 'semantic-ui-react'

import qs from 'query-string'

import { getCoursePopulation, getCoursePopulationCourses } from '../../redux/coursePopulation'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import PopulationCourses from '../PopulationCourseStats'
import infoTooltips from '../../common/InfoToolTips'
import InfoBox from '../InfoBox'
import SegmentDimmer from '../SegmentDimmer'


const CourseStudents = ({ getCoursePopulationDispatch, getCoursePopulationCoursesDispatch, studentData, courses, pending, history, translate }) => {
  const parseQueryFromUrl = () => {
    const { location } = history
    const query = qs.parse(location.search)
    return query
  }
  useEffect(() => {
    const query = parseQueryFromUrl()
    getCoursePopulationDispatch({ coursecode: query.coursecode, yearcode: query.yearcode })
    getCoursePopulationCoursesDispatch({ coursecode: query.coursecode, yearcode: query.yearcode })
  }, [])
  const { CreditAccumulationGraph, CoursesOf } = infoTooltips.PopulationStatistics

  const selectedStudents = studentData.students ? studentData.students.map(student => student.studentNumber) : []

  return (
    <div className="segmentContainer">
      {studentData.students ? (
        <div>
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
              <Popup
                trigger={<Header.Content>{translate('populationCourses.header')}</Header.Content>}
                content="Sort by clicking columns. Click course name to limit observed population to students who
                  participated to the course."
                wide
                position="top left"
              />
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
        </div>
      ) : (<div />)}
    </div>
  )
}

CourseStudents.propTypes = {
  getCoursePopulationDispatch: func.isRequired,
  getCoursePopulationCoursesDispatch: func.isRequired,
  pending: bool.isRequired,
  courses: shape([]).isRequired,
  studentData: shape({}).isRequired,
  history: shape({}).isRequired,
  translate: func.isRequired
}

const mapStateToProps = ({ coursePopulation, locale }) => ({
  studentData: coursePopulation.students,
  courses: coursePopulation.courses,
  pending: coursePopulation.pending,
  translate: getTranslate(locale),
  query: coursePopulation.query
})

export default withRouter(connect(mapStateToProps, { getCoursePopulationDispatch: getCoursePopulation, getCoursePopulationCoursesDispatch: getCoursePopulationCourses })(CourseStudents))
