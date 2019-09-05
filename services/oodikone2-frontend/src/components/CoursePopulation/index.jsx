import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, func, bool, arrayOf, string } from 'prop-types'
import { getTranslate } from 'react-localize-redux'
import { Segment, Header } from 'semantic-ui-react'
import qs from 'query-string'
import { intersection, difference } from 'lodash'
import { getCoursePopulation } from '../../redux/populations'
import { getCoursePopulationCourses } from '../../redux/populationCourses'
import { getSingleCourseStats } from '../../redux/singleCourseStats'
import { clearPopulationFilters } from '../../redux/populationFilters'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import infoTooltips from '../../common/InfoToolTips'
import InfoBox from '../InfoBox'
import CustomPopulationFilters from '../CustomPopulationFilters'
import CoursePopulationGradeDist from '../CoursePopulationGradeDist'
import CustomPopulationProgrammeDist from '../CustomPopulationProgrammeDist'
import CustomPopulationCourses from '../CustomPopulationCourses'
import ProgressBar from '../ProgressBar'
import { useProgress } from '../../common'

const CoursePopulation = ({
  getCoursePopulationDispatch,
  getCoursePopulationCoursesDispatch,
  getSingleCourseStatsDispatch,
  clearPopulationFiltersDispatch,
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
  const [codes, setCodes] = useState([])
  const [headerYear, setYear] = useState('')
  const [yearCode, setYearCode] = useState('')

  const {
    onProgress,
    progress
  } = useProgress((pending && !studentData.students))

  useEffect(() => {
    const query = parseQueryFromUrl()
    getCoursePopulationDispatch({ coursecodes: query.coursecodes, yearcode: query.yearcode, onProgress })
    getCoursePopulationCoursesDispatch({ coursecodes: JSON.parse(query.coursecodes), yearcode: query.yearcode })
    getSingleCourseStatsDispatch({ fromYear: query.yearcode, toYear: query.yearcode, courseCodes: JSON.parse(query.coursecodes), separate: false })
    setCodes(JSON.parse(query.coursecodes))
    setYearCode(query.yearcode)
    setYear(query.year)
    clearPopulationFiltersDispatch()
  }, [])

  const { CreditAccumulationGraph } = infoTooltips.PopulationStatistics
  const header = courseData ? `${courseData.name} ${headerYear}` : null

  return (
    <div className="segmentContainer">
      {studentData.students ? (
        <Segment className="contentSegment">
          <Header className="segmentTitle" size="large" textAlign="center">Population of course {header}</Header>
          <CustomPopulationFilters samples={studentData.students} coursecodes={codes} />
          <Segment>
            <Header>Grade distribution</Header>
            <CoursePopulationGradeDist yearcode={yearCode} selectedStudents={selectedStudents} />
          </Segment>
          <Segment>
            <Header>Programme distribution</Header>
            <CustomPopulationProgrammeDist samples={studentData.students} selectedStudents={selectedStudents} />
          </Segment>
          <PopulationStudents
            samples={studentData.students}
            selectedStudents={selectedStudents}
          />
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
          <CustomPopulationCourses
            selectedStudents={selectedStudents}
          />
        </Segment>
      ) :
        (
          <Segment className="contentSegment">
            <ProgressBar progress={progress} />
          </Segment>
        )
      }
    </div>
  )
}

CoursePopulation.propTypes = {
  getCoursePopulationDispatch: func.isRequired,
  getCoursePopulationCoursesDispatch: func.isRequired,
  getSingleCourseStatsDispatch: func.isRequired,
  clearPopulationFiltersDispatch: func.isRequired,
  pending: bool.isRequired,
  studentData: shape({}).isRequired,
  history: shape({}).isRequired,
  translate: func.isRequired,
  courseData: shape({}).isRequired,
  selectedStudents: arrayOf(string).isRequired
}

const mapStateToProps = ({ localize, singleCourseStats, populationFilters, populations }) => {
  const samples = populations.data.students ? populations.data.students : []
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
    studentData: populations.data,
    pending: populations.pending,
    translate: getTranslate(localize),
    query: populations.query,
    courseData: singleCourseStats.stats || {},
    selectedStudents
  })
}

export default withRouter(connect(mapStateToProps, {
  getCoursePopulationDispatch: getCoursePopulation,
  getCoursePopulationCoursesDispatch: getCoursePopulationCourses,
  getSingleCourseStatsDispatch: getSingleCourseStats,
  clearPopulationFiltersDispatch: clearPopulationFilters
})(CoursePopulation))
