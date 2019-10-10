import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, func, bool, arrayOf, string } from 'prop-types'
import { Segment, Header } from 'semantic-ui-react'
import qs from 'query-string'
import { intersection, difference } from 'lodash'
import { getCoursePopulation } from '../../redux/populations'
import { getCoursePopulationCourses } from '../../redux/populationCourses'
import { getSingleCourseStats } from '../../redux/singleCourseStats'
import { clearPopulationFilters } from '../../redux/populationFilters'
import PopulationStudents from '../PopulationStudents'

import CustomPopulationFilters from '../CustomPopulationFilters'
import CoursePopulationGradeDist from '../CoursePopulationGradeDist'
import CustomPopulationProgrammeDist from '../CustomPopulationProgrammeDist'
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
  courseData,
  selectedStudents
}) => {
  const parseQueryFromUrl = () => {
    const { location } = history
    const query = qs.parse(location.search)
    return query
  }
  const [codes, setCodes] = useState([])
  const [headerYears, setYears] = useState('')
  const [yearCodes, setYearCodes] = useState([])

  const { onProgress, progress } = useProgress(pending && !studentData.students)

  useEffect(() => {
    const { coursecodes, from, to, years } = parseQueryFromUrl()
    const parsedCourseCodes = JSON.parse(coursecodes)
    getCoursePopulationDispatch({ coursecodes, from, to, onProgress })
    getCoursePopulationCoursesDispatch({ coursecodes: parsedCourseCodes, from, to })
    getSingleCourseStatsDispatch({
      fromYear: from,
      toYear: to,
      courseCodes: parsedCourseCodes,
      separate: false
    })
    setCodes(parsedCourseCodes)
    setYearCodes([...Array(Number(to) + 1).keys()].slice(Number(from), Number(to) + 1))
    setYears(years)
    clearPopulationFiltersDispatch()
  }, [])

  const header = courseData ? `${courseData.name} ${headerYears}` : null

  return (
    <div className="segmentContainer">
      {studentData.students ? (
        <Segment className="contentSegment">
          <Header className="segmentTitle" size="large" textAlign="center">
            Population of course {header}
          </Header>
          <CustomPopulationFilters samples={studentData.students} coursecodes={codes} yearRange={headerYears} />
          <Segment>
            <Header>Grade distribution</Header>
            <CoursePopulationGradeDist
              yearcodes={yearCodes}
              selectedStudents={selectedStudents}
              yearRange={headerYears}
              samples={studentData.students}
            />
          </Segment>
          <Segment>
            <Header>Programme distribution</Header>
            <CustomPopulationProgrammeDist samples={studentData.students} selectedStudents={selectedStudents} />
          </Segment>
          <PopulationStudents samples={studentData.students} selectedStudents={selectedStudents} />
        </Segment>
      ) : (
        <Segment className="contentSegment">
          <ProgressBar progress={progress} />
        </Segment>
      )}
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
  courseData: shape({}).isRequired,
  selectedStudents: arrayOf(string).isRequired
}

const mapStateToProps = ({ singleCourseStats, populationFilters, populations }) => {
  const samples = populations.data.students ? populations.data.students : []
  let selectedStudents = samples.length > 0 ? samples.map(s => s.studentNumber) : []
  const { complemented } = populationFilters

  if (samples.length > 0 && populationFilters.filters.length > 0) {
    const studentsForFilter = f => {
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
  return {
    studentData: populations.data,
    pending: populations.pending,
    query: populations.query,
    courseData: singleCourseStats.stats || {},
    selectedStudents
  }
}

export default withRouter(
  connect(
    mapStateToProps,
    {
      getCoursePopulationDispatch: getCoursePopulation,
      getCoursePopulationCoursesDispatch: getCoursePopulationCourses,
      getSingleCourseStatsDispatch: getSingleCourseStats,
      clearPopulationFiltersDispatch: clearPopulationFilters
    }
  )(CoursePopulation)
)
