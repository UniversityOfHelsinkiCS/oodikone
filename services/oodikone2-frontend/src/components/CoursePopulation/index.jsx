import React, { useEffect, useState, useMemo } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, func, bool, arrayOf, string } from 'prop-types'
import { Segment, Header } from 'semantic-ui-react'
import qs from 'query-string'
import { intersection, difference } from 'lodash'
import { getCoursePopulation } from '../../redux/populations'
import { getSingleCourseStats } from '../../redux/singleCourseStats'
import { getSemesters } from '../../redux/semesters'
import PopulationStudents from '../PopulationStudents'

import CustomPopulationFilters from '../CustomPopulationFilters'
import CoursePopulationGradeDist from '../CoursePopulationGradeDist'
import CustomPopulationProgrammeDist from '../CustomPopulationProgrammeDist'
import ProgressBar from '../ProgressBar'
import { useProgress, getStudentToTargetCourseDateMap } from '../../common'

const CoursePopulation = ({
  getCoursePopulationDispatch,
  getSingleCourseStatsDispatch,
  studentData,
  pending,
  history,
  courseData,
  selectedStudents,
  getSemestersDispatch,
  semesters
}) => {
  const parseQueryFromUrl = () => {
    const { location } = history
    const query = qs.parse(location.search)
    return query
  }
  const [codes, setCodes] = useState([])
  const [headerYears, setYears] = useState('')
  const [dateFrom, setDateFrom] = useState(null)
  const [dateTo, setDateTo] = useState(null)

  const { onProgress, progress } = useProgress(pending && !studentData.students)
  const studentToTargetCourseDateMap = useMemo(
    () => getStudentToTargetCourseDateMap(studentData.students ? studentData.students : [], codes),
    [studentData.students, codes]
  )

  useEffect(() => {
    getSemestersDispatch()
  }, [])

  const getFromToDates = (from, to, separate) => {
    const targetProp = separate ? 'semestercode' : 'yearcode'
    const data = separate ? semesters.semesters : semesters.years
    const dataValues = Object.values(data)
    const findDateByCode = code => dataValues.find(d => d[targetProp] === code)

    return {
      dateFrom: findDateByCode(Number(from)).startdate,
      dateTo: findDateByCode(Number(to)).enddate
    }
  }

  useEffect(() => {
    if (semesters.years && semesters.semesters) {
      const { coursecodes, from, to, years, separate } = parseQueryFromUrl()
      const parsedCourseCodes = JSON.parse(coursecodes)
      getCoursePopulationDispatch({ coursecodes, from, to, onProgress, separate })
      getSingleCourseStatsDispatch({
        fromYear: from,
        toYear: to,
        courseCodes: parsedCourseCodes,
        separate
      })
      setCodes(parsedCourseCodes)
      setYears(years)
      getFromToDates(from, to, separate)

      const { dateFrom, dateTo } = getFromToDates(from, to, separate ? JSON.parse(separate) : false)
      setDateFrom(dateFrom)
      setDateTo(dateTo)
    }
  }, [semesters])

  const header = courseData ? `${courseData.name} ${headerYears}` : null
  const subHeader = codes.join(', ')

  if (!dateFrom || !dateTo) return null

  return (
    <div className="segmentContainer">
      {studentData.students ? (
        <Segment className="contentSegment">
          <Header className="segmentTitle" size="large" textAlign="center">
            Population of course {header}
          </Header>
          <Header className="segmentTitle" size="medium" textAlign="center">
            {subHeader}
          </Header>
          <CustomPopulationFilters
            studentToTargetCourseDateMap={studentToTargetCourseDateMap}
            samples={studentData.students}
            coursecodes={codes}
            from={dateFrom}
            to={dateTo}
          />
          <Segment>
            <Header>Grade distribution</Header>
            <CoursePopulationGradeDist
              selectedStudents={selectedStudents}
              from={dateFrom}
              to={dateTo}
              samples={studentData.students}
              codes={codes}
            />
          </Segment>
          <Segment>
            <Header>Programme distribution</Header>
            <CustomPopulationProgrammeDist
              studentToTargetCourseDateMap={studentToTargetCourseDateMap}
              samples={studentData.students}
              selectedStudents={selectedStudents}
            />
          </Segment>
          <PopulationStudents
            studentToTargetCourseDateMap={studentToTargetCourseDateMap}
            samples={studentData.students}
            selectedStudents={selectedStudents}
          />
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
  getSingleCourseStatsDispatch: func.isRequired,
  getSemestersDispatch: func.isRequired,
  pending: bool.isRequired,
  studentData: shape({}).isRequired,
  history: shape({}).isRequired,
  courseData: shape({}).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  semesters: shape({
    semesters: shape({}),
    years: shape({})
  }).isRequired
}

const mapStateToProps = ({ singleCourseStats, populationFilters, populations, semesters }) => {
  const samples = populations.data.students ? populations.data.students : []
  let selectedStudents = samples.length > 0 ? samples.map(s => s.studentNumber) : []
  const { complemented } = populationFilters

  if (samples.length > 0 && populationFilters.filters.length > 0) {
    const studentsForFilter = f => {
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
    selectedStudents,
    semesters: semesters.data
  }
}

export default withRouter(
  connect(
    mapStateToProps,
    {
      getCoursePopulationDispatch: getCoursePopulation,
      getSingleCourseStatsDispatch: getSingleCourseStats,
      getSemestersDispatch: getSemesters
    }
  )(CoursePopulation)
)
