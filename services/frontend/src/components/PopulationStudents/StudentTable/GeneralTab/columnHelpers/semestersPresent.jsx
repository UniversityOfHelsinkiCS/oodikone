import Tooltip from '@mui/material/Tooltip'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

import { isFall, isMastersProgramme } from '@/common'

import './semestersPresent.css'

dayjs.extend(isBetween)

export const getSemestersPresentFunctions = ({
  currentSemester,
  allSemesters,
  getTextIn,
  programmeCode,
  studentToSecondStudyrightEndMap,
  studentToStudyrightEndMap,
  year,
  semestersToAddToStart,
}) => {
  const { semestercode: currentSemesterCode } = currentSemester

  const getFirstAndLastSemester = () => {
    const last = currentSemesterCode + 1 * isFall(currentSemesterCode)

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

  const enrollmentTypeText = (enrollmenttype, statutoryAbsence) => {
    switch (enrollmenttype) {
      case 1:
        return 'Enrolled as present'
      case 2:
        return statutoryAbsence ? 'Enrolled as absent (statutory)' : 'Enrolled as absent'
      case 3:
        return 'Not enrolled'
      default:
        return 'No study right'
    }
  }

  const enrollmentTypeLabel = (enrollmenttype, statutoryAbsence) => {
    switch (enrollmenttype) {
      case 1:
        return 'present'
      case 2:
        return statutoryAbsence ? 'absent-statutory' : 'absent'
      case 3:
        return 'passive'
      default:
        return 'none'
    }
  }

  const getSemesterEnrollmentsContent = (student, studyright) => {
    if (!student.semesterEnrollmentsMap && !studyright) return null

    const isMasters = isMastersProgramme(programmeCode ?? '')

    const firstGraduation = studentToStudyrightEndMap.get(student.studentNumber)
    const secondGraduation = studentToSecondStudyrightEndMap.get(student.studentNumber)

    const semesterIcons = Array.from(Array(lastSemester - firstSemester + 1).keys()).map((_, index) => {
      const semester = index + firstSemester
      const key = `${student.studentNumber}-${semester}`

      const enrollmenttype =
        student.semesterEnrollmentsMap?.[semester]?.enrollmenttype ??
        studyright?.semesterEnrollments?.find(enrollment => enrollment.semester === semester)?.type
      const statutoryAbsence =
        student.semesterEnrollmentsMap?.[semester]?.statutoryAbsence ??
        studyright?.semesterEnrollments?.find(enrollment => enrollment.semester === semester)?.statutoryAbsence

      const { startdate, enddate, name: semesterName } = allSemesters[semester]
      const graduated = programmeCode
        ? (() => {
            if (firstGraduation && dayjs(firstGraduation).isBetween(startdate, enddate)) return 1 + 1 * isMasters
            if (secondGraduation && dayjs(secondGraduation).isBetween(startdate, enddate)) return 2 - 1 * isMasters
            return 0
          })()
        : 0

      const typeLabel = enrollmentTypeLabel(enrollmenttype, statutoryAbsence)
      const typeText = enrollmentTypeText(enrollmenttype, statutoryAbsence)

      const graduationText = graduated ? `(graduated as ${graduated === 1 ? 'Bachelor' : 'Master'})` : ''
      const onHoverString = `${typeText} in ${getTextIn(semesterName)} ${graduationText}`

      const springMargin = isFall(semester) ? '' : 'margin-right'
      const graduationCrown = graduated ? (graduated === 2 ? 'graduated-higher' : 'graduated') : ''

      return (
        <Tooltip key={key} placement="top" title={onHoverString}>
          <span className={`enrollment-label-no-margin ${springMargin} label-${typeLabel} ${graduationCrown}`} />
        </Tooltip>
      )
    })

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

  return {
    getSemesterEnrollmentsContent,
    getSemesterEnrollmentsVal,
  }
}
