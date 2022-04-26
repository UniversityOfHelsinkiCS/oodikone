import React, { useEffect, useState, useMemo, useRef } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import moment from 'moment'
import _ from 'lodash'
import { Segment, Header, Accordion } from 'semantic-ui-react'
import scrollToComponent from 'react-scroll-to-component'
import InfoBox from 'components/Info/InfoBox'
import { getCoursePopulation } from '../../redux/populations'
import { getSingleCourseStats } from '../../redux/singleCourseStats'
import { useGetStudentListCourseStatisticsQuery } from '../../redux/populationCourses'
import { getFaculties } from '../../redux/faculties'
import { useGetSemestersQuery } from '../../redux/semesters'
import { getElementDetails } from '../../redux/elementdetails'
import PopulationStudents from '../PopulationStudents'
import CoursePopulationGradeDist from './CoursePopulationGradeDist'
import CoursePopulationLanguageDist from './CoursePopulationLanguageDist'
import CoursePopulationCreditGainTable from './CoursePopulationCreditGainTable'
import CustomPopulationProgrammeDist from '../CustomPopulation/CustomPopulationProgrammeDist'
import CustomPopulationCourses from '../CustomPopulation/CustomPopulationCourses'
import ProgressBar from '../ProgressBar'
import { getStudentToTargetCourseDateMap, getTextIn, getUnifyTextIn } from '../../common'
import { useProgress, useTitle } from '../../common/hooks'
import infotooltips from '../../common/InfoToolTips'
import {
  ageFilter,
  gradeFilter,
  genderFilter,
  courseFilter,
  creditsEarnedFilter,
  startYearAtUniFilter,
  programmeFilter,
  studyTrackFilter,
} from '../FilterView/filters'
import FilterView from '../FilterView'
import useLanguage from '../LanguagePicker/useLanguage'
import { queryParamsFromUrl } from '../../common/query'

const NO_PROGRAMME = {
  code: '00000',
  name: { en: 'No programme', fi: 'Ei ohjelmaa' },
  startdate: '',
}

const CoursePopulation = ({
  getCoursePopulationDispatch,
  getSingleCourseStatsDispatch,
  getElementDetails,
  studentData,
  pending,
  history,
  courseData,
  getFacultiesDispatch,
  unifyCourses,
}) => {
  const { language } = useLanguage()
  const [codes, setCodes] = useState([])
  const [headerYears, setYears] = useState('')
  const [dateFrom, setDateFrom] = useState(null)
  const [dateTo, setDateTo] = useState(null)
  const [activeIndex, setIndex] = useState([])
  const [newestIndex, setNewest] = useState(null)

  const gradeDistRef = useRef()
  const languageDistRef = useRef()
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

  const { data: courseStatistics } = useGetStudentListCourseStatisticsQuery({
    studentNumbers: studentData.students ? studentData.students.map(student => student.studentNumber) : [],
  })

  const { data: semesters = {} } = useGetSemestersQuery()

  useEffect(() => {
    getElementDetails()
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
      const { coursecodes, from, to, years, years2, separate, unifyCourses } = queryParamsFromUrl(history.location)
      const parsedCourseCodes = JSON.parse(coursecodes)
      getCoursePopulationDispatch({ coursecodes, from, to, onProgress, separate, unifyCourses })
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

  const avoin = getUnifyTextIn(unifyCourses)
  const header = courseData ? `${getTextIn(courseData.name, language)} ${headerYears} ${avoin}` : null

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
            Language distribution
          </span>
        ),
      },
      onTitleClick: () => handleClick(1),
      content: {
        content: (
          <div ref={languageDistRef}>
            <InfoBox content={infotooltips.PopulationStatistics.LanguageDistributionCoursePopulation} />
            <CoursePopulationLanguageDist from={dateFrom} to={dateTo} samples={studentData.students} codes={codes} />
          </div>
        ),
      },
    },
    {
      key: 2,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Programme distribution
          </span>
        ),
      },
      onTitleClick: () => handleClick(2),
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
      key: 3,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Courses of population
          </span>
        ),
      },
      onTitleClick: () => handleClick(3),
      content: {
        content: (
          <div ref={programmeRef}>
            <CustomPopulationCoursesWrapper filteredStudents={filtered} showFilter={false} />
          </div>
        ),
      },
    },
    {
      key: 4,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Credit gains
          </span>
        ),
      },
      onTitleClick: () => handleClick(4),
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
      key: 5,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Students ({filtered.length})
          </span>
        ),
      },
      onTitleClick: () => handleClick(5),
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

  const studyRightPredicate = (student, sre) => {
    const date = _.chain(student)
      .get('courses')
      .filter(c => courses.includes(c.course_code))
      .map('date')
      .max()
      .value()

    return sre.code === NO_PROGRAMME.code || moment(date).isBetween(sre.startdate, sre.enddate, 'day', '[]')
  }

  return (
    <FilterView
      name="CoursePopulation"
      filters={[
        genderFilter,
        ageFilter,
        courseFilter({ courses: courseStatistics?.coursestatistics }),
        creditsEarnedFilter,
        startYearAtUniFilter,
        programmeFilter({
          additionalModes: [
            {
              key: 'attainment',
              label: 'Attainment',
              predicate: studyRightPredicate,
              description: 'Student had an active study right at the time of course attainment.',
            },
          ],
        }),
        gradeFilter({
          courseCodes: courses,
          from: dateFrom,
          to: dateTo,
        }),
        studyTrackFilter({
          activeAt: dateFrom,
        }),
      ]}
      initialOptions={{
        [programmeFilter.key]: { mode: 'attainment', selectedProgrammes: [] },
      }}
      students={studentData.students ?? []}
    >
      {filtered => (
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
      )}
    </FilterView>
  )
}

const CustomPopulationCoursesWrapper = props => {
  const { data: courseStatistics, isLoading } = useGetStudentListCourseStatisticsQuery({
    studentNumbers: props.filteredStudents.map(student => student.studentNumber),
  })

  if (isLoading) return null

  return <CustomPopulationCourses {...props} courses={courseStatistics} />
}

const mapStateToProps = ({ singleCourseStats, populations, courseSearch }) => {
  return {
    studentData: populations.data,
    pending: populations.pending,
    courseData: singleCourseStats.stats?.[courseSearch.openOrReqular],
    unifyCourses: courseSearch.openOrReqular,
    elementDetails: populations?.data?.elementdetails?.data,
  }
}

export default withRouter(
  connect(mapStateToProps, {
    getCoursePopulationDispatch: getCoursePopulation,
    getSingleCourseStatsDispatch: getSingleCourseStats,
    getFacultiesDispatch: getFaculties,
    getElementDetails,
  })(CoursePopulation)
)
