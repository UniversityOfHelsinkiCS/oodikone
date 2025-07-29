import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

import { isFall, isMastersProgramme } from '@/common'

import './semestersPresent.css'

dayjs.extend(isBetween)

export const getSemestersPresentFunctions = ({
  getTextIn,
  programme,
  studentToSecondStudyrightEndMap,
  studentToStudyrightEndMap,
  year,
  semestersToAddToStart,
  semesters,
}) => {
  const allSemesters = semesters?.semesters ?? {}
  const { semestercode: currentSemesterCode } = semesters?.currentSemester ?? { semestercode: 0 }

  const getFirstAndLastSemester = () => {
    const lastSemester = currentSemesterCode + 1 * Number(isFall(currentSemesterCode))

    const associatedYear = year !== 'All' && year
    const firstSemester = associatedYear
      ? (Object.values(allSemesters).find(
          semester => new Date(semester.startdate).getTime() === new Date(Date.UTC(associatedYear, 7, 1)).getTime()
        )?.semestercode ?? lastSemester) - (semestersToAddToStart ?? 0)
      : lastSemester - 13

    return [firstSemester, lastSemester]
  }

  const [firstSemester, lastSemester] = getFirstAndLastSemester()

  const getSemesterEnrollmentsContent = (student, studyright = undefined) => {
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

    if (!student.semesterEnrollmentsMap && !studyright) return []

    const isMasters = isMastersProgramme(programme ?? '')

    const firstGraduation = studentToStudyrightEndMap.get(student.studentNumber)
    const secondGraduation = studentToSecondStudyrightEndMap.get(student.studentNumber)

    return Array.from(Array(lastSemester - firstSemester + 1).keys()).map((_, index) => {
      const semester = index + firstSemester
      const key = `${student.studentNumber}-${semester}`

      const enrollmenttype =
        student.semesterEnrollmentsMap?.[semester]?.enrollmenttype ??
        studyright?.semesterEnrollments?.find(enrollment => enrollment.semester === semester)?.type
      const statutoryAbsence =
        student.semesterEnrollmentsMap?.[semester]?.statutoryAbsence ??
        studyright?.semesterEnrollments?.find(enrollment => enrollment.semester === semester)?.statutoryAbsence

      const { startdate, enddate, name: semesterName } = allSemesters[semester]
      const graduated = programme
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

      const graduationCrown = graduated ? (graduated === 2 ? 'graduated-higher' : 'graduated') : ''

      return { key, onHoverString, typeLabel, graduationCrown }
    })
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
