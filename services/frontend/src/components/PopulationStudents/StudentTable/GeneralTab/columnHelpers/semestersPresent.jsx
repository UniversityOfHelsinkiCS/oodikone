import Tooltip from '@mui/material/Tooltip'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

import { getCurrentSemester, isFall, isMastersProgramme } from '@/common'

import './semestersPresent.css'

dayjs.extend(isBetween)

export const getSemestersPresentFunctions = ({
  allSemesters,
  allSemestersMap,
  filteredStudents,
  getTextIn,
  programmeCode,
  studentToSecondStudyrightEndMap,
  studentToStudyrightEndMap,
  year,
  semestersToAddToStart,
}) => {
  if (!allSemesters || !filteredStudents)
    return {
      getSemesterEnrollmentsContent: () => null,
      getSemesterEnrollmentsVal: () => {},
      getFirstSemester: () => {},
      getLastSemester: () => {},
    }

  const { semestercode: currentSemesterCode } = getCurrentSemester(allSemestersMap) || {}

  const last = currentSemesterCode + 1 * isFall(currentSemesterCode)
  const getFirstAndLastSemester = () => {
    const associatedYear = year !== 'All' && year
    if (associatedYear) {
      const first = Object.values(allSemesters).find(
        semester => new Date(semester.startdate).getTime() === new Date(Date.UTC(associatedYear, 7, 1)).getTime()
      ).semestercode

      return { first: first - (semestersToAddToStart ?? 0), last }
    }

    return { first: last - 13, last }
  }

  const { first: firstSemester, last: lastSemester } =
    Object.keys(allSemesters).length > 0 ? getFirstAndLastSemester() : { first: 0, last: 0 }

  const enrollmentTypeText = (type, statutoryAbsence) => {
    if (type === 1) return 'Enrolled as present'
    if (type === 2 && statutoryAbsence) return 'Enrolled as absent (statutory)'
    if (type === 2) return 'Enrolled as absent'
    if (type === 3) return 'Not enrolled'
    return 'No study right'
  }

  const graduatedOnSemester = (student, semester, programmeCode) => {
    if (!programmeCode) return 0
    const firstGraduation = studentToStudyrightEndMap.get(student.studentNumber)
    const secondGraduation = studentToSecondStudyrightEndMap.get(student.studentNumber)
    if (
      firstGraduation &&
      dayjs(firstGraduation).isBetween(allSemestersMap[semester].startdate, allSemestersMap[semester].enddate)
    ) {
      if (!isMastersProgramme(programmeCode)) return 1
      return 2
    }
    if (
      secondGraduation &&
      dayjs(secondGraduation).isBetween(allSemestersMap[semester].startdate, allSemestersMap[semester].enddate)
    ) {
      if (isMastersProgramme(programmeCode)) return 1
      return 2
    }
    return 0
  }

  const getSemesterEnrollmentsContent = (student, studyright) => {
    if (allSemesters.length === 0) return null
    if (!student.semesterEnrollmentsMap && !studyright) return null
    const semesterIcons = []

    const getSemesterJSX = (semester, enrollmenttype, statutoryAbsence, graduated, key) => {
      let type
      switch (enrollmenttype) {
        case 1:
          type = 'present'
          break
        case 2:
          type = statutoryAbsence ? 'absent-statutory' : 'absent'
          break
        case 3:
          type = 'passive'
          break
        default:
          type = 'none'
          break
      }

      const graduationCrownClassName = graduated ? (graduated === 2 ? 'graduated-higher' : 'graduated') : ''

      const graduationText = graduated ? `(graduated as ${graduated === 1 ? 'Bachelor' : 'Master'})` : ''
      const onHoverString = `
        ${enrollmentTypeText(enrollmenttype, statutoryAbsence)} in ${getTextIn(allSemestersMap[semester]?.name)} ${graduationText}
      `

      return (
        <Tooltip key={key} placement="top" title={onHoverString}>
          <span
            className={`enrollment-label-no-margin label-${type} ${isFall(semester) ? '' : 'margin-right'} ${graduationCrownClassName}`}
          />
        </Tooltip>
      )
    }

    for (let semester = firstSemester; semester <= lastSemester; semester++) {
      let enrollmenttype
      let statutoryAbsence

      if (student.semesterEnrollmentsMap) {
        enrollmenttype = student.semesterEnrollmentsMap[semester]?.enrollmenttype
        statutoryAbsence = student.semesterEnrollmentsMap[semester]?.statutoryAbsence
      } else {
        const enrollment = studyright.semesterEnrollments?.find(enrollment => enrollment.semester === semester)
        enrollmenttype = enrollment?.type
        statutoryAbsence = enrollment?.statutoryAbsence
      }

      semesterIcons.push(
        getSemesterJSX(
          semester,
          enrollmenttype,
          statutoryAbsence,
          graduatedOnSemester(student, semester, programmeCode),
          `${student.studentNumber}-${semester}`
        )
      )
    }

    return <div style={{ display: 'flex', gap: '4px' }}>{semesterIcons}</div>
  }

  const getSemesterEnrollmentsVal = (student, studyright) => {
    const enrollmentsToCount = studyright
      ? (studyright.semesterEnrollments ?? [])
      : Object.entries(student.semesterEnrollmentsMap || {}).map(([semester, data]) => ({
          semestercode: semester,
          enrollmenttype: data.enrollmenttype,
        }))

    return enrollmentsToCount.reduce(
      (acc, cur) =>
        acc + (cur.enrollmenttype === 1 && firstSemester <= cur.semestercode && cur.semestercode <= lastSemester),
      0
    )
  }

  const getFirstSemester = () => firstSemester

  const getLastSemester = () => lastSemester

  return {
    getFirstSemester,
    getLastSemester,
    getSemesterEnrollmentsContent,
    getSemesterEnrollmentsVal,
  }
}
