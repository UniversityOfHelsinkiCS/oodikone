import React, { useEffect, useState, useMemo } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, func, bool, arrayOf, string } from 'prop-types'
import { Segment, Header, Icon, Button } from 'semantic-ui-react'
import qs from 'query-string'
import { intersection, difference } from 'lodash'
import { getCoursePopulation, updatePopulationStudents } from '../../redux/populations'
import { getSingleCourseStats } from '../../redux/singleCourseStats'
import { clearPopulationFilters } from '../../redux/populationFilters'
import { getFaculties } from '../../redux/faculties'
import { getSemesters } from '../../redux/semesters'
import PopulationStudents from '../PopulationStudents'

import CustomPopulationFilters from '../CustomPopulationFilters'
import CoursePopulationGradeDist from '../CoursePopulationGradeDist'
import CoursePopulationCreditGainTable from '../CoursePopulationCreditGainTable'
import CustomPopulationProgrammeDist from '../CustomPopulationProgrammeDist'
import ProgressBar from '../ProgressBar'
import { useProgress, getStudentToTargetCourseDateMap, useTitle, getUserIsAdmin } from '../../common'
import infotooltips from '../../common/InfoToolTips'
import InfoBox from '../InfoBox'

const CoursePopulation = ({
  getCoursePopulationDispatch,
  getSingleCourseStatsDispatch,
  studentData,
  pending,
  history,
  courseData,
  selectedStudents,
  getSemestersDispatch,
  clearPopulationFiltersDispatch,
  semesters,
  updatePopulationStudentsDispatch,
  getFacultiesDispatch
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
  useTitle('Course population')

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
      clearPopulationFiltersDispatch()
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
      getFacultiesDispatch()

      const { dateFrom, dateTo } = getFromToDates(from, to, separate ? JSON.parse(separate) : false)
      setDateFrom(dateFrom)
      setDateTo(dateTo)
    }
  }, [semesters])

  const header = courseData ? `${courseData.name} ${headerYears}` : null
  const subHeader = codes.join(', ')

  if (!dateFrom || !dateTo) return null

  if (!studentData.students) {
    return (
      <Segment className="contentSegment">
        <ProgressBar progress={progress} />
      </Segment>
    )
  }

  return (
    <div className="segmentContainer">
      <Segment className="contentSegment">
        <Header className="segmentTitle" size="large" textAlign="center">
          Population of course {header}
        </Header>
        <Header className="segmentTitle" size="medium" textAlign="center">
          {subHeader}
        </Header>
        <Header className="segmentTitle" size="medium" textAlign="center">
          <Button
            compact
            size="medium"
            labelPosition="left"
            onClick={() => updatePopulationStudentsDispatch(selectedStudents.filter(number => number.length < 10))}
          >
            <Icon name="refresh" />
            update population
          </Button>
        </Header>
        <CustomPopulationFilters
          studentToTargetCourseDateMap={studentToTargetCourseDateMap}
          samples={studentData.students}
          coursecodes={codes}
          from={dateFrom}
          to={dateTo}
          coursePopulation
        />
        <Segment>
          <Header>
            Grade distribution
            <InfoBox content={infotooltips.PopulationStatistics.GradeDistributionCoursePopulation} />
          </Header>
          <CoursePopulationGradeDist
            selectedStudents={selectedStudents}
            from={dateFrom}
            to={dateTo}
            samples={studentData.students}
            codes={codes}
          />
        </Segment>
        <Segment>
          <Header>
            Programme distribution{' '}
            <InfoBox content={infotooltips.PopulationStatistics.ProgrammeDistributionCoursePopulation} />
          </Header>
          <CustomPopulationProgrammeDist
            studentToTargetCourseDateMap={studentToTargetCourseDateMap}
            samples={studentData.students}
            selectedStudents={selectedStudents}
          />
        </Segment>
        <CoursePopulationCreditGainTable
          studentToTargetCourseDateMap={studentToTargetCourseDateMap}
          selectedStudents={selectedStudents}
          samples={studentData.students}
          codes={codes}
          from={dateFrom}
          to={dateTo}
        />
        <PopulationStudents
          studentToTargetCourseDateMap={studentToTargetCourseDateMap}
          samples={studentData.students}
          selectedStudents={selectedStudents}
        />
      </Segment>
    </div>
  )
}

CoursePopulation.propTypes = {
  getCoursePopulationDispatch: func.isRequired,
  getSingleCourseStatsDispatch: func.isRequired,
  getSemestersDispatch: func.isRequired,
  clearPopulationFiltersDispatch: func.isRequired,
  updatePopulationStudentsDispatch: func.isRequired,
  pending: bool.isRequired,
  studentData: shape({}).isRequired,
  history: shape({}).isRequired,
  courseData: shape({}).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  semesters: shape({
    semesters: shape({}),
    years: shape({})
  }).isRequired,
  getFacultiesDispatch: func.isRequired
}

const mapStateToProps = ({
  singleCourseStats,
  populationFilters,
  populations,
  semesters,
  auth: {
    token: { roles }
  }
}) => {
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
    semesters: semesters.data,
    isAdmin: getUserIsAdmin(roles)
  }
}

export default withRouter(
  connect(
    mapStateToProps,
    {
      getCoursePopulationDispatch: getCoursePopulation,
      getSingleCourseStatsDispatch: getSingleCourseStats,
      getSemestersDispatch: getSemesters,
      clearPopulationFiltersDispatch: clearPopulationFilters,
      updatePopulationStudentsDispatch: updatePopulationStudents,
      getFacultiesDispatch: getFaculties
    }
  )(CoursePopulation)
)
