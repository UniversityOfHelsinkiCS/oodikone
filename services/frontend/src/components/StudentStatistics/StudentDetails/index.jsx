import { isEmpty, sortBy } from 'lodash'
import moment from 'moment'
import { arrayOf, bool, func, number, shape, string } from 'prop-types'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { Loader, Segment } from 'semantic-ui-react'

import { bachelorHonoursProgrammes as bachelorCodes, getNewestProgramme } from '@/common'
import { StudentInfoCard } from '@/components/StudentStatistics/StudentInfoCard'
import { clearCourseStats } from '@/redux/coursestats'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { getStudent, removeStudentSelection, resetStudent } from '@/redux/students'
import { BachelorHonours } from './BachelorHonours'
import { CourseParticipationTable } from './CourseParticipationTable'
import { StudentGraphs } from './StudentGraphs'
import { StudyrightsTable } from './StudyrightsTable'
import { TagsTable } from './TagsTable'

const StudentDetails = ({
  student,
  studentNumber,
  getStudent,
  student: { semesterenrollments },
  resetStudent,
  removeStudentSelection,
  pending,
  error,
  fetching,
  clearCourseStats,
}) => {
  const [graphYearStart, setGraphYear] = useState(null)
  const [studyrightid, setStudyrightid] = useState('')
  let honoursCode
  const { data: semesters } = useGetSemestersQuery()
  const { data: programmesAndStudyTracks } = useGetProgrammesQuery()
  const programmes = programmesAndStudyTracks?.programmes

  useEffect(() => {
    setGraphYear(null)
    if (studentNumber.length > 0) getStudent(studentNumber)
    else {
      resetStudent()
      removeStudentSelection()
    }
  }, [studentNumber])

  if (programmes && student && student.studyrights) {
    const bachelorStudyrights = student.studyrights.filter(studyright => studyright.extentcode === 1)
    const newestBachelorProgramme = getNewestProgramme(bachelorStudyrights, student.studentNumber, null, programmes)
    // currently only for matlu
    const shouldRender = bachelorCodes.includes(newestBachelorProgramme.code)
    if (!shouldRender && honoursCode !== null) honoursCode = null
    if (shouldRender) honoursCode = newestBachelorProgramme.code
  }

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
        absences={getAbsentYears()}
        graphYearStart={graphYearStart}
        semesters={semesters}
        student={student}
        studyRightId={studyrightid}
      />
      <TagsTable student={student} />
      <StudyrightsTable
        handleStartDateChange={handleStartDateChange}
        showPopulationStatistics={showPopulationStatistics}
        student={student}
        studyrightid={studyrightid}
      />
      {honoursCode && <BachelorHonours absentYears={getAbsentYears()} programmeCode={honoursCode} student={student} />}
      <CourseParticipationTable clearCourseStats={clearCourseStats} student={student} studyrightid={studyrightid} />
    </Segment>
  )
}

StudentDetails.propTypes = {
  getStudent: func.isRequired,
  resetStudent: func.isRequired,
  clearCourseStats: func.isRequired,
  removeStudentSelection: func.isRequired,
  studentNumber: string,
  student: shape({
    courses: arrayOf(
      shape({
        course: shape({
          code: string,
          name: Object,
        }),
        credits: number,
        date: string,
        grade: string,
        passed: bool,
      })
    ),
    credits: number,
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
}

StudentDetails.defaultProps = {
  student: {},
  studentNumber: '',
}

const mapStateToProps = ({ students }) => ({
  student: students.data.find(student => student.studentNumber === students.selected),
  pending: students.pending,
  error: students.error,
  fetching: students.fetching,
})

const mapDispatchToProps = {
  removeStudentSelection,
  clearCourseStats,
  resetStudent,
  getStudent,
}

export const ConnectedStudentDetails = connect(mapStateToProps, mapDispatchToProps)(StudentDetails)
