import React, { useEffect, useState, useMemo, useRef } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, func, bool, arrayOf, string } from 'prop-types'
import { Segment, Header, Accordion, Popup } from 'semantic-ui-react'
import qs from 'query-string'
import { intersection, difference } from 'lodash'
import ReactMarkdown from 'react-markdown'
import scrollToComponent from 'react-scroll-to-component'

import { getCoursePopulation } from '../../redux/populations'
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
import { getStudentToTargetCourseDateMap, getUserIsAdmin } from '../../common'
import { useProgress, useTitle } from '../../common/hooks'
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
  const [activeIndex, setIndex] = useState([])
  const [newestIndex, setNewest] = useState(null)

  const gradeDistRef = useRef()
  const programmeRef = useRef()
  const creditGainRef = useRef()
  const studentRef = useRef()
  const refs = [gradeDistRef, programmeRef, creditGainRef, studentRef]
  useTitle('Course population')

  const { onProgress, progress } = useProgress(pending && !studentData.students)
  const studentToTargetCourseDateMap = useMemo(
    () => getStudentToTargetCourseDateMap(studentData.students ? studentData.students : [], codes),
    [studentData.students, codes]
  )

  useEffect(() => {
    getSemestersDispatch()
  }, [])

  useEffect(() => {
    if (newestIndex) {
      scrollToComponent(refs[newestIndex].current, { align: 'bottom' })
    }
  }, [activeIndex])

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

  const handleClick = index => {
    const indexes = [...activeIndex].sort()
    if (indexes.includes(index)) {
      indexes.splice(indexes.findIndex(ind => ind === index), 1)
    } else {
      indexes.push(index)
    }
    if (activeIndex.length < indexes.length) setNewest(index)
    else setNewest(null)
    setIndex(indexes)
  }

  const panels = [
    {
      key: 0,
      title: {
        content: (
          <>
            {activeIndex.includes(0) ? (
              <>Grade distribution</>
            ) : (
              <Popup
                trigger={
                  <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
                    Grade distribution
                  </span>
                }
                position="top center"
                offset="0, 50px"
                wide="very"
              >
                <Popup.Content>
                  {' '}
                  <ReactMarkdown
                    source={infotooltips.PopulationStatistics.GradeDistributionCoursePopulation}
                    escapeHtml={false}
                  />
                </Popup.Content>
              </Popup>
            )}
          </>
        )
      },
      onTitleClick: () => handleClick(0),
      content: {
        content: (
          <div ref={gradeDistRef}>
            <InfoBox content={infotooltips.PopulationStatistics.GradeDistributionCoursePopulation} />
            <CoursePopulationGradeDist
              selectedStudents={selectedStudents}
              from={dateFrom}
              to={dateTo}
              samples={studentData.students}
              codes={codes}
            />
          </div>
        )
      }
    },
    {
      key: 1,
      title: {
        content: (
          <>
            {activeIndex.includes(1) ? (
              <>Programme distribution</>
            ) : (
              <Popup
                trigger={
                  <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
                    Programme distribution
                  </span>
                }
                position="top center"
                offset="0, 50px"
                wide="very"
              >
                <Popup.Content>
                  {' '}
                  <ReactMarkdown
                    source={infotooltips.PopulationStatistics.ProgrammeDistributionCoursePopulation}
                    escapeHtml={false}
                  />
                </Popup.Content>
              </Popup>
            )}
          </>
        )
      },
      onTitleClick: () => handleClick(1),
      content: {
        content: (
          <div ref={programmeRef}>
            <InfoBox content={infotooltips.PopulationStatistics.ProgrammeDistributionCoursePopulation} />
            <CustomPopulationProgrammeDist
              studentToTargetCourseDateMap={studentToTargetCourseDateMap}
              samples={studentData.students}
              selectedStudents={selectedStudents}
            />
          </div>
        )
      }
    },
    {
      key: 2,
      title: {
        content: (
          <>
            {activeIndex.includes(2) ? (
              <>Credit gains</>
            ) : (
              <Popup
                trigger={
                  <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
                    Credit gains
                  </span>
                }
                position="top center"
                offset="0, 50px"
                wide="very"
              >
                <Popup.Content>
                  {' '}
                  <ReactMarkdown
                    source={infotooltips.PopulationStatistics.CreditDistributionCoursePopulation}
                    escapeHtml={false}
                  />
                </Popup.Content>
              </Popup>
            )}
          </>
        )
      },
      onTitleClick: () => handleClick(2),
      content: {
        content: (
          <div ref={creditGainRef}>
            <CoursePopulationCreditGainTable
              studentToTargetCourseDateMap={studentToTargetCourseDateMap}
              selectedStudents={selectedStudents}
              samples={studentData.students}
              codes={codes}
              from={dateFrom}
              to={dateTo}
            />
          </div>
        )
      }
    },
    {
      key: 3,
      title: {
        content: (
          <>
            {activeIndex.includes(3) ? (
              <>Students ({selectedStudents.length})</>
            ) : (
              <Popup
                trigger={
                  <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
                    Students ({selectedStudents.length})
                  </span>
                }
                position="top center"
                offset="0, 50px"
                wide="very"
              >
                <Popup.Content>
                  {' '}
                  <ReactMarkdown
                    source={infotooltips.PopulationStatistics.Students.AccordionTitle}
                    escapeHtml={false}
                  />
                </Popup.Content>
              </Popup>
            )}
          </>
        )
      },
      onTitleClick: () => handleClick(3),
      content: {
        content: (
          <div ref={studentRef}>
            <PopulationStudents
              studentToTargetCourseDateMap={studentToTargetCourseDateMap}
              samples={studentData.students}
              selectedStudents={selectedStudents}
              coursePopulation
              accordionView
            />
          </div>
        )
      }
    }
  ]

  return (
    <div className="segmentContainer">
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
          coursePopulation
        />
        <Accordion activeIndex={activeIndex} exclusive={false} styled fluid panels={panels} />
      </Segment>
    </div>
  )
}

CoursePopulation.propTypes = {
  getCoursePopulationDispatch: func.isRequired,
  getSingleCourseStatsDispatch: func.isRequired,
  getSemestersDispatch: func.isRequired,
  clearPopulationFiltersDispatch: func.isRequired,
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
      getFacultiesDispatch: getFaculties
    }
  )(CoursePopulation)
)
