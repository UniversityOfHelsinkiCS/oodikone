import { isEmpty, orderBy } from 'lodash'
import moment from 'moment'
import { useState } from 'react'
import { Loader, Message } from 'semantic-ui-react'

import { bachelorHonoursProgrammes as bachelorCodes } from '@/common'
import { StudentInfoCard } from '@/components/StudentStatistics/StudentInfoCard'
import { useGetSemestersQuery } from '@/redux/semesters'
import { useGetStudentQuery } from '@/redux/students'
import { BachelorHonours } from './BachelorHonours'
import { CourseParticipationTable } from './CourseParticipationTable'
import { StudentGraphs } from './StudentGraphs'
import { StudyrightsTable } from './StudyrightsTable'
import { TagsTable } from './TagsTable'

export const StudentDetails = ({ studentNumber }) => {
  const [graphYearStart, setGraphYear] = useState(null)
  const [selectedStudyPlanId, setSelectedStudyPlanId] = useState(null)
  let honoursCode
  const { data: semesters } = useGetSemestersQuery()
  const { data: student, isLoading, isError } = useGetStudentQuery(studentNumber)

  if (student?.studyRights) {
    const bachelorStudyRights = orderBy(
      student.studyRights
        .filter(studyRight => [1, 5].includes(studyRight.extentCode))
        .flatMap(studyRight => studyRight.studyRightElements)
        .filter(element => element.phase === 1),
      ['startDate'],
      ['desc']
    )
    const [newestBachelorProgramme] = bachelorStudyRights
    // currently only for matlu
    if (bachelorCodes.includes(newestBachelorProgramme?.code)) {
      honoursCode = newestBachelorProgramme.code
    }
  }

  const getAbsentYears = () => {
    const semesterEnrollments = student.semesterenrollments.toSorted((a, b) => a.semestercode - b.semestercode)
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
    const mappedSemesterenrollments = semesterEnrollments.reduce(
      (res, curr) => ({ ...res, [curr.semestercode]: curr }),
      {}
    )
    const patchedSemesterenrollments = []
    if (semesterEnrollments.length) {
      let runningSemestercode = semesterEnrollments[0].semestercode
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

  const handleStudyPlanChange = id => {
    if (id === selectedStudyPlanId) {
      setSelectedStudyPlanId(null)
      setGraphYear(null)
    } else {
      setSelectedStudyPlanId(id)
      const { programme_code: programmeCode, sis_study_right_id: studyRightId } = student.studyplans.find(
        plan => plan.id === id
      )
      const studyRight = student.studyRights.find(studyright => studyright.id === studyRightId)
      const programme = studyRight.studyRightElements.find(element => element.code === programmeCode)
      setGraphYear(programme.startDate)
    }
  }

  if (isLoading) return <Loader active />

  if ((!studentNumber || isEmpty(student) || !semesters) && !isError) return null

  if (isError)
    return <Message header="Student not found or no sufficient permissions" icon="warning sign" negative size="big" />

  return (
    <>
      <StudentInfoCard student={student} />
      <StudentGraphs
        absences={getAbsentYears()}
        graphYearStart={graphYearStart}
        selectedStudyPlanId={selectedStudyPlanId}
        semesters={semesters}
        student={student}
      />
      <TagsTable student={student} />
      <StudyrightsTable
        handleStudyPlanChange={handleStudyPlanChange}
        selectedStudyPlanId={selectedStudyPlanId}
        showPopulationStatistics={showPopulationStatistics}
        student={student}
      />
      {honoursCode && <BachelorHonours absentYears={getAbsentYears()} programmeCode={honoursCode} student={student} />}
      <CourseParticipationTable selectedStudyPlanId={selectedStudyPlanId} student={student} />
    </>
  )
}
