import React, { useEffect, useState } from 'react'
import { func, shape, string, arrayOf, integer, bool } from 'prop-types'
import { connect, useDispatch } from 'react-redux'
import { Segment, Loader } from 'semantic-ui-react'
import { isEmpty, sortBy } from 'lodash'
import moment from 'moment'

import { withRouter } from 'react-router-dom'

import { getStudent, removeStudentSelection, resetStudent } from '../../../redux/students'
import { useGetSemestersQuery } from '../../../redux/semesters'
import StudentInfoCard from '../StudentInfoCard'
import { bachelorHonoursProgrammes as bachelorCodes, getNewestProgramme } from '../../../common'
import { clearCourseStats } from '../../../redux/coursestats'
import { getProgrammes } from '../../../redux/populationProgrammes'
import BachelorHonours from './BachelorHonours'
import StudyrightsTable from './StudyrightsTable'
import TagsTable from './TagsTable'
import CourseParticipationTable from './CourseParticipationTable'
import StudentGraphs from './StudentGraphs'
import useLanguage from '../../LanguagePicker/useLanguage'
import { getMandatoryCourseModules } from '../../../redux/populationMandatoryCourses'

const StudentDetails = ({
  student,
  Programmes,
  studentNumber,
  getStudent,
  student: { semesterenrollments },
  resetStudent,
  removeStudentSelection,
  getProgrammes,
  pending,
  error,
  fetching,
  clearCourseStats,
}) => {
  const dispatch = useDispatch()
  const { language } = useLanguage()
  const [graphYearStart, setGraphYear] = useState(null)
  const [studyrightid, setStudyrightid] = useState('')
  const [honoursCode, setHonoursCode] = useState(null)

  const { data: semesters } = useGetSemestersQuery()

  useEffect(() => {
    getProgrammes()
  }, [])

  useEffect(() => {
    setGraphYear(null)
    if (studentNumber.length > 0) getStudent(studentNumber)
    else {
      resetStudent()
      removeStudentSelection()
    }
  }, [studentNumber])

  useEffect(() => {
    if (Programmes.programmes && student && student.studyrights) {
      const bachelorStudyrights = student.studyrights.filter(sr => sr.extentcode === 1)
      const newestBachelorProgramme = getNewestProgramme(
        bachelorStudyrights,
        student.studentNumber,
        null,
        Programmes.programmes
      )
      // currently only for matlu
      const shouldRender = bachelorCodes.includes(newestBachelorProgramme.code)
      if (shouldRender) dispatch(getMandatoryCourseModules(newestBachelorProgramme.code))
      if (shouldRender) setHonoursCode(newestBachelorProgramme.code)
    }
  }, [Programmes, student])

  const getAbsentYears = () => {
    semesterenrollments.sort((a, b) => a.semestercode - b.semestercode)
    const acualSemesters = semesters?.semesters ?? {}

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
          patchedSemesterenrollments.push({ semestercode: runningSemestercode, enrollmenttype: -1 })
        else patchedSemesterenrollments.push(mappedSemesterenrollments[runningSemestercode])
        runningSemestercode++
      }
    }

    const formatAbsence = ({ semestercode, enrollmenttype, statutoryAbsence }) => {
      const { startdate, enddate } = mappedSemesters[semestercode]
      return {
        semestercode,
        enrollmenttype,
        statutoryAbsence,
        startdate: new Date(startdate).getTime(),
        enddate: new Date(enddate).getTime(),
      }
    }

    const mergeAbsences = absences => {
      const res = []
      let currentSemestercode = -1
      let currentType = 0
      let currentStatutory = 0
      if (absences.length) {
        res.push(absences[0])
        currentSemestercode = absences[0].semestercode
        currentType = absences[0].enrollmenttype
        currentStatutory = absences[0].statutoryAbsence
      }
      absences.forEach((absence, i) => {
        if (i === 0) return
        if (
          absence.semestercode === currentSemestercode + 1 &&
          absence.enrollmenttype === currentType &&
          absence.statutoryAbsence === currentStatutory
        )
          res[res.length - 1].enddate = absence.enddate
        else res.push(absence)
        currentSemestercode = absence.semestercode
        currentType = absence.enrollmenttype
        currentStatutory = absence.statutoryAbsence
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
      setStudyrightid('')
      return
    }

    const getTarget = () => sortBy(elements.programmes, 'startdate', ['desc'])[0] || { startdate: graphYearStart }

    const { startdate } = getTarget()
    setGraphYear(startdate)
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
      <StudentInfoCard student={student} />
      <StudentGraphs
        student={student}
        absences={getAbsentYears()}
        graphYearStart={graphYearStart}
        semesters={semesters}
        language={language}
        studyRightId={studyrightid}
      />
      <TagsTable student={student} language={language} />
      <StudyrightsTable
        Programmes={Programmes}
        student={student}
        language={language}
        handleStartDateChange={handleStartDateChange}
        showPopulationStatistics={showPopulationStatistics}
        studyrightid={studyrightid}
      />
      {honoursCode && <BachelorHonours student={student} absentYears={getAbsentYears()} programmeCode={honoursCode} />}
      <CourseParticipationTable
        student={student}
        language={language}
        clearCourseStats={clearCourseStats}
        studyrightid={studyrightid}
      />
    </Segment>
  )
}

StudentDetails.propTypes = {
  getStudent: func.isRequired,
  resetStudent: func.isRequired,
  clearCourseStats: func.isRequired,
  Programmes: shape({}).isRequired,
  removeStudentSelection: func.isRequired,
  studentNumber: string,
  student: shape({
    courses: arrayOf(
      shape({
        course: shape({
          code: string,
          name: Object,
        }),
        credits: integer,
        date: string,
        grade: string,
        passed: bool,
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
        tag: shape({ studytrack: string, tagname: string }),
      })
    ),
  }),
  pending: bool.isRequired,
  error: bool.isRequired,
  fetching: bool.isRequired,
  getProgrammes: func.isRequired,
}

StudentDetails.defaultProps = {
  student: {},
  studentNumber: '',
}

const mapStateToProps = ({ students, populationProgrammes }) => ({
  student: students.data.find(student => student.studentNumber === students.selected),
  pending: students.pending,
  error: students.error,
  fetching: students.fetching,
  Programmes: populationProgrammes.data || {},
})

const mapDispatchToProps = {
  removeStudentSelection,
  clearCourseStats,
  resetStudent,
  getStudent,
  getProgrammes,
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(StudentDetails))
