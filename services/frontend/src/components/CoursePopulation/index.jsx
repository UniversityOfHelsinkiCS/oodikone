import React, { useEffect, useState, useMemo } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import moment from 'moment'
import _ from 'lodash'
import { Segment, Header, Form, Input } from 'semantic-ui-react'
import InfoBox from 'components/Info/InfoBox'
import PopulationCourseStatsFlat from 'components/PopulationCourseStats/PopulationCourseStatsFlat'
import PanelView from 'components/common/PanelView'
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
import ProgressBar from '../ProgressBar'
import { getStudentToTargetCourseDateMap, getUnifyTextIn } from '../../common'
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
  studentNumberFilter,
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
  const { getTextIn } = useLanguage()
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

  const { data: courseStatistics } = useGetStudentListCourseStatisticsQuery({
    studentNumbers: studentData.students ? studentData.students.map(student => student.studentNumber) : [],
  })

  const { data: semesters = {} } = useGetSemestersQuery()

  useEffect(() => {
    getElementDetails()
  }, [])

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
  const header = courseData ? `${getTextIn(courseData.name)} ${headerYears} ${avoin}` : null

  const subHeader = codes.join(', ')

  if (!dateFrom || !dateTo) return null

  if (!studentData.students) {
    return (
      <Segment className="contentSegment">
        <ProgressBar progress={progress} />
      </Segment>
    )
  }

  const createPanels = filtered => [
    {
      title: 'Grade distribution',
      content: (
        <div>
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
    {
      title: 'Language distribution',
      content: (
        <div>
          <InfoBox content={infotooltips.PopulationStatistics.LanguageDistributionCoursePopulation} />
          <CoursePopulationLanguageDist from={dateFrom} to={dateTo} samples={filtered} codes={codes} />
        </div>
      ),
    },
    {
      title: 'Programme distribution',
      content: (
        <div>
          <InfoBox content={infotooltips.PopulationStatistics.ProgrammeDistributionCoursePopulation} />
          <CustomPopulationProgrammeDist
            studentToTargetCourseDateMap={studentToTargetCourseDateMap}
            samples={filtered}
            coursecode={codes}
            selectedStudents={filtered.map(s => s.studentNumber)}
          />
        </div>
      ),
    },
    {
      title: 'Courses of population',
      content: <CustomPopulationCoursesWrapper filteredStudents={filtered} />,
    },
    {
      title: 'Credit gains',
      content: (
        <CoursePopulationCreditGainTable
          studentToTargetCourseDateMap={studentToTargetCourseDateMap}
          selectedStudents={filtered.map(s => s.studentNumber)}
          samples={filtered}
          codes={codes}
          from={dateFrom}
          to={dateTo}
        />
      ),
    },
    {
      title: `Students (${filtered.length})`,
      content: (
        <PopulationStudents
          variant="coursePopulation"
          studentToTargetCourseDateMap={studentToTargetCourseDateMap}
          filteredStudents={filtered}
          coursecode={codes}
          from={dateFrom}
          to={dateTo}
        />
      ),
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
        studentNumberFilter,
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
            <PanelView panels={createPanels(filtered)} />
          </Segment>
        </div>
      )}
    </FilterView>
  )
}

const CustomPopulationCoursesWrapper = ({ filteredStudents }) => {
  const { data: courseStatistics, isLoading } = useGetStudentListCourseStatisticsQuery({
    studentNumbers: filteredStudents.map(student => student.studentNumber),
  })

  const [studentAmountLimit, setStudentAmountLimit] = useState(0)

  useEffect(() => {
    setStudentAmountLimit(Math.round(filteredStudents.length ? filteredStudents.length * 0.3 : 0))
  }, [filteredStudents.length])

  const onStudentAmountLimitChange = value => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }

  if (isLoading) return null

  return (
    <>
      <InfoBox content={infotooltips.PopulationStatistics.CoursesOfPopulation} />
      <Form style={{ padding: '4px 4px 4px 8px' }}>
        <Form.Field inline>
          <label>Limit to courses where student number is at least</label>
          <Input
            value={studentAmountLimit}
            onChange={e => onStudentAmountLimitChange(e.target.value)}
            style={{ width: '70px' }}
          />
        </Form.Field>
      </Form>
      <PopulationCourseStatsFlat
        filteredStudents={filteredStudents}
        studentAmountLimit={studentAmountLimit}
        courses={courseStatistics}
      />
    </>
  )
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
