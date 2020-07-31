import React, { useEffect, useState } from 'react'
import { func, shape, string, arrayOf, integer, bool } from 'prop-types'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { Segment, Loader } from 'semantic-ui-react'
import { isEmpty, sortBy } from 'lodash'
import moment from 'moment'

import { withRouter } from 'react-router-dom'

import { getStudent, removeStudentSelection, resetStudent } from '../../../redux/students'
import { getSemesters } from '../../../redux/semesters'
import StudentInfoCard from '../StudentInfoCard'
import { getUserIsAdmin } from '../../../common'
import { clearCourseStats } from '../../../redux/coursestats'
import { getDegreesAndProgrammes } from '../../../redux/populationDegreesAndProgrammes'
import BachelorHonours from './BachelorHonours'
import StudyrightsTable from './StudyrightsTable'
import TagsTable from './TagsTable'
import CourseParticipationTable from './CourseParticipationTable'
import StudentGraphs from './StudentGraphs'

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
  const [graphYearStart, setGraphYear] = useState('')
  const [degreename, setDegreename] = useState('')
  const [studyrightid, setStudyrightid] = useState('')

  useEffect(() => {
    getDegreesAndProgrammes()
    getSemesters()
  }, [])

  useEffect(() => {
    setGraphYear('')
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
    const now = new Date().setHours(0, 0, 0, 0) // needs to be done due to semester table being a mess
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
      setGraphYear('')
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

  if (fetching) return <Loader active={fetching} />
  if ((pending || !studentNumber || isEmpty(student) || !semesters) && !error) return null
  if (error) {
    return (
      <Segment textAlign="center">
        <p>Student not found or no sufficient permissions</p>
      </Segment>
    )
  }

  return (
    <Segment className="contentSegment">
      <StudentInfoCard student={student} translate={translate} />
      <StudentGraphs
        student={student}
        absences={getAbsentYears()}
        translate={translate}
        graphYearStart={graphYearStart}
        semesters={semesters}
        language={language}
      />
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
