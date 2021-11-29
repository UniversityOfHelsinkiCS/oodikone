import React, { useEffect, useState, useMemo, useRef } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, func, bool } from 'prop-types'
import { Segment, Header, Accordion } from 'semantic-ui-react'
import scrollToComponent from 'react-scroll-to-component'
import { getCoursePopulation } from '../../redux/populations'
import { getSingleCourseStats } from '../../redux/singleCourseStats'
import { getCustomPopulationCoursesByStudentnumbers } from '../../redux/populationCourses'
import { getFaculties } from '../../redux/faculties'
import { getSemesters } from '../../redux/semesters'
import { getElementDetails } from '../../redux/elementdetails'
import PopulationStudents from '../PopulationStudents'
import CoursePopulationGradeDist from './CoursePopulationGradeDist'
import CoursePopulationCreditGainTable from './CoursePopulationCreditGainTable'
import CustomPopulationProgrammeDist from '../CustomPopulation/CustomPopulationProgrammeDist'
import CustomPopulationCourses from '../CustomPopulation/CustomPopulationCourses'
import ProgressBar from '../ProgressBar'
import { getStudentToTargetCourseDateMap, getUserIsAdmin, getTextIn } from '../../common'
import { useProgress, useTitle } from '../../common/hooks'
import infotooltips from '../../common/InfoToolTips'
import InfoBox from '../Info/InfoBox'
import FilterTray from '../FilterTray'
import {
  ageFilter,
  gradeFilter,
  genderFilter,
  courseFilter,
  creditsEarnedFilter,
  programmeFilter,
} from '../FilterTray/filters'
import { FilterView } from '../FilterTray/useFilters'
import useLanguage from '../LanguagePicker/useLanguage'
import { queryParamsFromUrl } from '../../common/query'

const CoursePopulation = ({
  getCoursePopulationDispatch,
  getSingleCourseStatsDispatch,
  getElementDetails,
  studentData,
  courseStatistics,
  pending,
  elementDetails,
  history,
  courseData,
  getSemestersDispatch,
  semesters,
  getFacultiesDispatch,
  getCustomPopulationCoursesByStudentnumbers,
}) => {
  const { language } = useLanguage()

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

  // Pass students to filter context.
  useEffect(() => {
    // setAllStudents(studentData.students || [])

    // Data fetching for courses of population tab
    if (!studentData.students) return
    getCustomPopulationCoursesByStudentnumbers({
      studentnumberlist: studentData.students.map(student => student.studentNumber),
    })
  }, [studentData.students])

  useEffect(() => {
    getElementDetails()
    getSemestersDispatch()
  }, [])

  useEffect(() => {
    if (newestIndex && refs[newestIndex]) {
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
      dateTo: findDateByCode(Number(to)).enddate,
    }
  }

  useEffect(() => {
    if (semesters.years && semesters.semesters) {
      const { coursecodes, from, to, years, years2, separate } = queryParamsFromUrl(history.location)
      const parsedCourseCodes = JSON.parse(coursecodes)
      getCoursePopulationDispatch({ coursecodes, from, to, onProgress, separate })
      getSingleCourseStatsDispatch({
        fromYear: from,
        toYear: to,
        courseCodes: parsedCourseCodes,
        separate,
      })
      setCodes(parsedCourseCodes)
      if (years) {
        setYears(years)
      } else {
        setYears(years2)
      }
      getFromToDates(from, to, separate)
      getFacultiesDispatch()

      const { dateFrom, dateTo } = getFromToDates(from, to, separate ? JSON.parse(separate) : false)
      setDateFrom(dateFrom)
      setDateTo(dateTo)
    }
  }, [semesters])

  const header = courseData ? `${getTextIn(courseData.name, language)} ${headerYears}` : null

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
      indexes.splice(
        indexes.findIndex(ind => ind === index),
        1
      )
    } else {
      indexes.push(index)
    }
    if (activeIndex.length < indexes.length) setNewest(index)
    else setNewest(null)
    setIndex(indexes)
  }

  const panels = filtered => [
    {
      key: 0,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Grade distribution
          </span>
        ),
      },
      onTitleClick: () => handleClick(0),
      content: {
        content: (
          <div ref={gradeDistRef}>
            <InfoBox content={infotooltips.PopulationStatistics.GradeDistributionCoursePopulation} />
            <CoursePopulationGradeDist
              selectedStudents={filtered.map(s => s.studentNumber)}
              from={dateFrom}
              to={dateTo}
              samples={filtered}
              codes={codes}
            />
          </div>
        ),
      },
    },
    {
      key: 1,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Programme distribution
          </span>
        ),
      },
      onTitleClick: () => handleClick(1),
      content: {
        content: (
          <div ref={programmeRef}>
            <InfoBox content={infotooltips.PopulationStatistics.ProgrammeDistributionCoursePopulation} />
            <CustomPopulationProgrammeDist
              studentToTargetCourseDateMap={studentToTargetCourseDateMap}
              samples={filtered}
              selectedStudents={filtered.map(s => s.studentNumber)}
            />
          </div>
        ),
      },
    },
    {
      key: 2,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Courses of population
          </span>
        ),
      },
      onTitleClick: () => handleClick(2),
      content: {
        content: (
          <div ref={programmeRef}>
            <CustomPopulationCourses selectedStudents={filtered.map(s => s.studentNumber)} showFilter={false} />
          </div>
        ),
      },
    },
    {
      key: 3,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Credit gains
          </span>
        ),
      },
      onTitleClick: () => handleClick(3),
      content: {
        content: (
          <div ref={creditGainRef}>
            <CoursePopulationCreditGainTable
              studentToTargetCourseDateMap={studentToTargetCourseDateMap}
              selectedStudents={filtered.map(s => s.studentNumber)}
              samples={filtered}
              codes={codes}
              from={dateFrom}
              to={dateTo}
            />
          </div>
        ),
      },
    },
    {
      key: 4,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Students ({filtered.length})
          </span>
        ),
      },
      onTitleClick: () => handleClick(4),
      content: {
        content: (
          <div ref={studentRef}>
            <PopulationStudents
              variant="coursePopulation"
              studentToTargetCourseDateMap={studentToTargetCourseDateMap}
              filteredStudents={filtered}
              coursePopulation
              language={language}
              coursecode={codes}
            />
          </div>
        ),
      },
    },
  ]

  const courses = JSON.parse(queryParamsFromUrl(history.location).coursecodes)

  return (
    <FilterView
      name="CoursePopulation"
      filters={[
        genderFilter,
        ageFilter,
        courseFilter(courseStatistics),
        creditsEarnedFilter,
        programmeFilter(courses, elementDetails),
        gradeFilter(courses, dateFrom, dateTo),
      ]}
      students={studentData.students}
    >
      {filtered => (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <FilterTray />
          <div className="segmentContainer">
            <Segment className="contentSegment">
              <Header className="segmentTitle" size="large" textAlign="center">
                Population of course {header}
              </Header>
              <Header className="segmentTitle" size="medium" textAlign="center">
                {subHeader}
              </Header>
              <Accordion activeIndex={activeIndex} exclusive={false} styled fluid panels={panels(filtered)} />
            </Segment>
          </div>
        </div>
      )}
    </FilterView>
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
  semesters: shape({
    semesters: shape({}),
    years: shape({}),
  }).isRequired,
  getFacultiesDispatch: func.isRequired,
  getCustomPopulationCoursesByStudentnumbers: func.isRequired,
}

const mapStateToProps = ({
  singleCourseStats,
  populations,
  semesters,
  populationCourses,
  auth: {
    token: { roles },
  },
}) => {
  return {
    studentData: populations.data,
    pending: populations.pending,
    courseData: singleCourseStats.stats || {},
    courseStatistics: populationCourses?.data?.coursestatistics,
    semesters: semesters.data,
    elementDetails: populations?.data?.elementdetails?.data,
    isAdmin: getUserIsAdmin(roles),
  }
}

export default withRouter(
  connect(mapStateToProps, {
    getCoursePopulationDispatch: getCoursePopulation,
    getSingleCourseStatsDispatch: getSingleCourseStats,
    getSemestersDispatch: getSemesters,
    getFacultiesDispatch: getFaculties,
    getElementDetails,
    getCustomPopulationCoursesByStudentnumbers,
  })(CoursePopulation)
)
