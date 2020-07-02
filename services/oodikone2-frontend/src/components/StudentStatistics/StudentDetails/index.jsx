import React, { useEffect, useState } from 'react'
import { func, shape, string, arrayOf, integer, bool } from 'prop-types'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { Segment, Loader, Menu, Tab, Input, Message } from 'semantic-ui-react'
import { isEmpty, sortBy, flattenDeep, cloneDeep } from 'lodash'
import moment from 'moment'
import Highcharts from 'highcharts/highstock'
import ReactHighcharts from 'react-highcharts'
import { withRouter } from 'react-router-dom'

import { getStudent, removeStudentSelection, resetStudent } from '../../../redux/students'
import { getSemesters } from '../../../redux/semesters'
import StudentInfoCard from '../StudentInfoCard'
import CreditAccumulationGraphHighCharts from '../../CreditAccumulationGraphHighCharts'
import { byDateDesc, reformatDate, getTextIn, getUserIsAdmin } from '../../../common'
import { clearCourseStats } from '../../../redux/coursestats'
import { getDegreesAndProgrammes } from '../../../redux/populationDegreesAndProgrammes'
import BachelorHonours from './BachelorHonours'
import StudyrightsTable from './StudyrightsTable'
import TagsTable from './TagsTable'
import CourseParticipationTable from './CourseParticipationTable'
import TSA from '../../../common/tsa'

const ANALYTICS_CATEGORY = 'Student stats'
const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent(ANALYTICS_CATEGORY, action, name, value)

const StudentDetails = ({
  student,
  language,
  degreesAndProgrammes,
  studentNumber,
  getStudent,
  semesters,
  student: { semesterenrollments },
  resetStudent,
  removeStudentSelection,
  translate,
  getDegreesAndProgrammes,
  getSemesters,
  pending,
  error,
  fetching,
  clearCourseStats
}) => {
  const [graphYearStart, setGraphYear] = useState(null)
  const [degreename, setDegreename] = useState('')
  const [studyrightid, setStudyrightid] = useState(null)
  const [chunky, setChunky] = useState(false)
  const [semester, setSemester] = useState(false)
  const [chunksize, setChunkSize] = useState(5)

  useEffect(() => {
    getDegreesAndProgrammes()
    getSemesters()
  }, [])

  useEffect(() => {
    setGraphYear(null)
    if (studentNumber.length > 0) getStudent(studentNumber)
    else {
      resetStudent()
      removeStudentSelection()
    }
  }, [studentNumber])

  const getAbsentYears = () => {
    semesterenrollments.sort((a, b) => a.semestercode - b.semestercode)
    const acualSemesters = semesters.semesters

    if (!acualSemesters) return []

    const mappedSemesters = Object.values(acualSemesters).reduce(
      (acc, { semestercode, startdate, enddate }) => ({ ...acc, [semestercode]: { startdate, enddate } }),
      {}
    )

    // If a student has been absent for a long period, then the enrollments aren't marked in oodi...
    // Therefore we need to manually patch empty enrollment ranges with absences
    const now = new Date().getTime()
    const latestSemester = parseInt(
      Object.entries(mappedSemesters).find(
        ([, { startdate, enddate }]) => now <= new Date(enddate).getTime() && now >= new Date(startdate).getTime()
      )[0],
      10
    )
    const mappedSemesterenrollments = semesterenrollments.reduce(
      (res, curr) => ({ ...res, [curr.semestercode]: curr }),
      {}
    )
    const patchedSemesterenrollments = []
    if (semesterenrollments.length) {
      let runningSemestercode = semesterenrollments[0].semestercode
      while (runningSemestercode <= latestSemester) {
        if (!mappedSemesterenrollments[runningSemestercode])
          patchedSemesterenrollments.push({ semestercode: runningSemestercode, enrollmenttype: 2 })
        else patchedSemesterenrollments.push(mappedSemesterenrollments[runningSemestercode])
        runningSemestercode++
      }
    }

    const formatAbsence = ({ semestercode }) => {
      const { startdate, enddate } = mappedSemesters[semestercode]
      return {
        semestercode,
        startdate: new Date(startdate).getTime(),
        enddate: new Date(enddate).getTime()
      }
    }

    const mergeAbsences = absences => {
      const res = []
      let currentSemestercode = -1
      if (absences.length) {
        res.push(absences[0])
        currentSemestercode = absences[0].semestercode
      }
      absences.forEach((absence, i) => {
        if (i === 0) return
        if (absence.semestercode === currentSemestercode + 1) res[res.length - 1].enddate = absence.enddate
        else res.push(absence)
        currentSemestercode = absence.semestercode
      })
      return res
    }

    return mergeAbsences(
      patchedSemesterenrollments
        .filter(({ enrollmenttype }) => enrollmenttype !== 1) // 1 = present & 2 = absent
        .map(absence => formatAbsence(absence))
    )
  }

  const showPopulationStatistics = (studyprogramme, date) => {
    const year = moment(date).isBefore(moment(`${date.slice(0, 4)}-08-01`)) ? date.slice(0, 4) - 1 : date.slice(0, 4)
    const months = Math.ceil(moment.duration(moment().diff(`${year}-08-01`)).asMonths())
    return (
      `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=${year}`
    )
  }

  const handleStartDateChange = (elements, id) => {
    if (id === studyrightid) {
      setGraphYear(null)
      setDegreename('')
      setStudyrightid('')
      return
    }

    const getTarget = () =>
      elements.degree ||
      sortBy(elements.programmes, 'startdate', ['desc'])[0] || { startdate: graphYearStart, name: degreename }

    const { startdate, name } = getTarget()
    setGraphYear(startdate)
    setDegreename(name)
    setStudyrightid(id)
  }

  const renderCreditsGraph = () => {
    const selectedStart = graphYearStart || student.started
    const filteredCourses = student.courses.filter(c => new Date(c.date) > new Date(selectedStart))
    const newStudent = cloneDeep(student)
    newStudent.courses = filteredCourses
    const sample = [newStudent]

    const dates = flattenDeep(student.courses.map(c => c.date)).map(d => new Date(d).getTime())
    sample.maxCredits = newStudent.courses.reduce((a, c) => {
      if (c.isStudyModuleCredit || !c.passed) return a + 0
      return a + c.credits
    }, 0)
    sample.maxDate = dates.length > 0 ? Math.max(...dates) : new Date().getTime()
    sample.minDate = new Date(selectedStart).getTime()

    return (
      <CreditAccumulationGraphHighCharts
        singleStudent
        students={sample}
        selectedStudents={[student.studentNumber]}
        title={translate('studentStatistics.chartTitle')}
        translate={translate}
        maxCredits={sample.maxCredits}
        absences={getAbsentYears()}
      />
    )
  }

  const chunkifyArray = (array, size = 1) => {
    if (!array) return []
    const firstChunk = array.slice(0, size) // create the first chunk of the given array
    if (!firstChunk.length) {
      return array // this is the base case to terminal the recursive
    }
    return [firstChunk].concat(chunkifyArray(array.slice(size, array.length), size))
  }

  const semesterChunkify = (courses, semesterenrollments) => {
    const semesterChunks = semesterenrollments.reduce((acc, curr) => {
      const currSemester = semesters.semesters[curr.semestercode]
      const filteredcourses = courses.filter(
        c => new Date(currSemester.startdate) < new Date(c.date) && new Date(c.date) < new Date(currSemester.enddate)
      )
      const grades = { data: filteredcourses, semester: currSemester, numOfCourses: filteredcourses.length }
      acc.push(grades)
      return acc
    }, [])
    const semesterMeans = semesterChunks.reduce((acc, curr) => {
      const sum = curr.data.reduce((a, b) => a + b.grade, 0)
      if (curr.numOfCourses > 0)
        acc.push({
          name: getTextIn(curr.semester.name, language),
          y: sum / curr.numOfCourses,
          x: new Date(curr.data[curr.numOfCourses - 1].date).getTime()
        })
      return acc
    }, [])

    return [{ name: 'Semester mean', data: semesterMeans, seriesThreshold: 150 }]
  }

  // probably needs some fixing to be done
  const gradeMeanSeries = student => {
    const sortedCourses = student.courses.sort(byDateDesc).reverse()
    const filterCourses = sortedCourses.filter(c => Number(c.grade) && !c.isStudyModuleCredit && c.passed)
    const data = filterCourses.reduce(
      (acc, curr) => {
        acc.grades.push({ grade: Number(curr.grade), date: curr.date, code: curr.course_code })
        acc.dates.push(reformatDate(curr.date, 'DD.MM.YYYY'))
        const sum = acc.grades.reduce((a, b) => a + b.grade, 0)
        acc.mean.push({ y: sum / acc.grades.length, x: new Date(curr.date).getTime() })
        if (!acc.minDate) {
          acc.minDate = curr.date
          acc.maxDate = curr.date
        }
        if (acc.minDate > curr.date) acc.minDate = curr.date
        if (acc.maxDate < curr.date) acc.maxDate = curr.date
        return acc
      },
      { grades: [], dates: [], mean: [], minDate: null, maxDate: null }
    )
    const size = Number(chunksize) ? chunksize : 3
    const chunks = chunkifyArray(data.grades, size)
    data.semesterMeans = semesterChunkify(data.grades, student.semesterenrollments)
    const chunkMeans = chunks.reduce((acc, curr) => {
      const sum = curr.reduce((a, b) => a + b.grade, 0)
      if (curr.length > 0)
        acc.push({
          name: `${curr.length} courses`,
          y: sum / curr.length,
          x: new Date(curr[curr.length - 1].date).getTime()
        })
      return acc
    }, [])
    data.chunkMeans = [{ name: 'Group mean', data: chunkMeans, seriesThreshold: 150 }]
    return data
  }

  const renderGradeGraph = student => {
    sendAnalytics('Clicked grade graph', 'Student')
    const series = gradeMeanSeries(student)
    const { mean, chunkMeans, semesterMeans } = series

    const defaultOptions = {
      chart: {
        type: 'spline'
      },
      title: {
        text: 'Grade plot'
      },
      xAxis: {
        type: 'datetime',
        min: new Date(series.minDate).getTime(),
        max: new Date(series.maxDate).getTime()
      },
      yAxis: {
        min: 1,
        max: 5
      }
    }

    const totalMeanOptions = {
      ...defaultOptions,
      series: [{ data: mean, name: 'Total mean', seriesThreshold: 150 }]
    }
    const chunkMeanOptions = {
      ...defaultOptions,
      series: chunkMeans
    }
    const semesterMeanOptions = {
      ...defaultOptions,
      series: semesterMeans
    }
    return (
      <div align="center">
        <Message style={{ maxWidth: '600px' }}>
          <Message.Header>Grade graph</Message.Header>
          <p>
            Total mean näyttää kuinka keskiarvo on kehittynyt koko opintojen ajan. Group mean ottaa ryhmittää kurssit
            valitun koon mukaan ja ottaa niiden keskiarvot. Semester mean laskee jokaisen lukukauden keskiarvon.
          </p>
        </Message>
        <Menu compact align="center">
          <Menu.Item
            active={!chunky && !semester}
            name="Show total mean"
            onClick={() => {
              setChunky(false)
              setSemester(false)
              sendAnalytics('Clicked total mean', 'Student')
            }}
          />
          <Menu.Item
            active={chunky && !semester}
            name="Show group mean"
            onClick={() => {
              setChunky(true)
              setSemester(false)
              sendAnalytics('Clicked group mean', 'Student')
            }}
          />
          <Menu.Item
            active={!chunky && semester}
            name="Show semester mean"
            onClick={() => {
              setChunky(false)
              setSemester(true)
              sendAnalytics('Clicked semester mean', 'Student')
            }}
          />
        </Menu>
        {chunky && (
          <div>
            <Input label="Group size" defaultValue={chunksize} onChange={e => setChunkSize(Number(e.target.value))} />
          </div>
        )}
        {!chunky && !semester && <ReactHighcharts highcharts={Highcharts} config={totalMeanOptions} />}
        {chunky && !semester && <ReactHighcharts highcharts={Highcharts} config={chunkMeanOptions} />}
        {!chunky && semester && <ReactHighcharts highcharts={Highcharts} config={semesterMeanOptions} />}
      </div>
    )
  }

  if (fetching) return <Loader active={fetching} />
  if ((pending || !studentNumber || isEmpty(student) || !semesters) && !error) return null
  if (error) {
    return (
      <Segment textAlign="center">
        <p>Student not found or no sufficient permissions</p>
      </Segment>
    )
  }

  const panes = [
    { menuItem: 'Credit graph', render: () => <Tab.Pane>{renderCreditsGraph()}</Tab.Pane> },
    { menuItem: 'Grade graph', render: () => <Tab.Pane>{renderGradeGraph(student)}</Tab.Pane> }
  ]
  return (
    <Segment className="contentSegment">
      <StudentInfoCard student={student} translate={translate} />
      <Tab panes={panes} />
      <TagsTable student={student} language={language} />
      <StudyrightsTable
        degreesAndProgrammes={degreesAndProgrammes}
        student={student}
        language={language}
        handleStartDateChange={handleStartDateChange}
        showPopulationStatistics={showPopulationStatistics}
        studyrightid={studyrightid}
      />
      <BachelorHonours
        student={student}
        programmes={degreesAndProgrammes.programmes || {}}
        absentYears={getAbsentYears()}
      />
      <CourseParticipationTable
        student={student}
        language={language}
        translate={translate}
        clearCourseStats={clearCourseStats}
      />
    </Segment>
  )
}

StudentDetails.propTypes = {
  language: string.isRequired,
  getStudent: func.isRequired,
  resetStudent: func.isRequired,
  clearCourseStats: func.isRequired,
  degreesAndProgrammes: shape({}).isRequired,
  removeStudentSelection: func.isRequired,
  studentNumber: string,
  translate: func.isRequired,
  student: shape({
    courses: arrayOf(
      shape({
        course: shape({
          code: string,
          name: Object
        }),
        credits: integer,
        date: string,
        grade: string,
        passed: bool
      })
    ),
    credits: integer,
    fetched: bool,
    started: string,
    studentNumber: string,
    tags: arrayOf(
      shape({
        programme: shape({ code: string, name: shape({}) }),
        studentnumber: string,
        tag: shape({ studytrack: string, tagname: string })
      })
    )
  }),
  pending: bool.isRequired,
  error: bool.isRequired,
  fetching: bool.isRequired,
  getSemesters: func.isRequired,
  getDegreesAndProgrammes: func.isRequired,
  semesters: shape({
    semesters: shape({}),
    years: shape({})
  }).isRequired
}

StudentDetails.defaultProps = {
  student: {},
  studentNumber: ''
}

const mapStateToProps = ({
  students,
  localize,
  semesters,
  populationDegreesAndProgrammes,
  auth: {
    token: { roles }
  }
}) => ({
  language: getActiveLanguage(localize).code,
  student: students.data.find(student => student.studentNumber === students.selected),
  pending: students.pending,
  error: students.error,
  semesters: semesters.data,
  fetching: students.fetching,
  isAdmin: getUserIsAdmin(roles),
  degreesAndProgrammes: populationDegreesAndProgrammes.data || {}
})

const mapDispatchToProps = {
  removeStudentSelection,
  clearCourseStats,
  resetStudent,
  getStudent,
  getSemesters,
  getDegreesAndProgrammes
}

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(StudentDetails)
)
