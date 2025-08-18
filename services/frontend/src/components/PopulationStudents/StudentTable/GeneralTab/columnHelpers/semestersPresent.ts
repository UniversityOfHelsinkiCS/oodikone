import dayjs, { extend as dayjsExtend } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

import { isFall, isMastersProgramme } from '@/common'
import { type SemestersData } from '@/redux/semesters'

import './semestersPresent.css'
import { CloseToGraduationData } from '@oodikone/shared/routes/populations'
import { EnrollmentType } from '@oodikone/shared/types'

dayjsExtend(isBetween)

type SemesterPresentFnsProps = {
  getTextIn: (arg0: any) => string | null | undefined
  programme: string | null
  studentToSecondStudyrightEndMap: Map<string, string | null> | null
  studentToStudyrightEndMap: Map<string, string | null> | null
  year: number
  semestersToAddToStart: number | null
  semesters: SemestersData | null | undefined
}

export const getSemestersPresentFunctions = ({
  getTextIn,
  programme,
  studentToSecondStudyrightEndMap,
  studentToStudyrightEndMap,
  year,
  semestersToAddToStart,
  semesters,
}: SemesterPresentFnsProps) => {
  const allSemesters = semesters?.semesters ?? {}
  const { semestercode: currentSemesterCode } = semesters?.currentSemester ?? { semestercode: 0 }

  const getFirstAndLastSemester = () => {
    const lastSemester = currentSemesterCode + 1 * Number(isFall(currentSemesterCode))

    const firstSemester = year
      ? (Object.values(allSemesters).find(
          semester => new Date(semester.startdate).getTime() === new Date(Date.UTC(year, 7, 1)).getTime()
        )?.semestercode ?? lastSemester) - (semestersToAddToStart ?? 0)
      : lastSemester - 13

    return [firstSemester, lastSemester]
  }

  const [firstSemester, lastSemester] = getFirstAndLastSemester()

  const getSemesterEnrollmentsContent = (
    student: Pick<CloseToGraduationData['student'], 'studentNumber'>,
    studyright: Pick<CloseToGraduationData['studyright'], 'semesterEnrollments'>
  ) => {
    if (!studyright) return []

    const enrollmentTypeText = (enrollmenttype: EnrollmentType | undefined, statutoryAbsence: boolean | undefined) => {
      switch (enrollmenttype) {
        case EnrollmentType.PRESENT:
          return 'Enrolled as present'
        case EnrollmentType.ABSENT:
          return statutoryAbsence ? 'Enrolled as absent (statutory)' : 'Enrolled as absent'
        case EnrollmentType.INACTIVE:
          return 'Not enrolled'
        default:
          return 'No study right'
      }
    }

    const enrollmentTypeLabel = (enrollmenttype: EnrollmentType | undefined, statutoryAbsence: boolean | undefined) => {
      switch (enrollmenttype) {
        case EnrollmentType.PRESENT:
          return 'present'
        case EnrollmentType.ABSENT:
          return statutoryAbsence ? 'absent-statutory' : 'absent'
        case EnrollmentType.INACTIVE:
          return 'passive'
        default:
          return 'none'
      }
    }

    const isMasters = isMastersProgramme(programme ?? '')

    const firstGraduation = studentToStudyrightEndMap?.get(student.studentNumber)
    const secondGraduation = studentToSecondStudyrightEndMap?.get(student.studentNumber)

    return Array.from(Array(lastSemester - firstSemester + 1).keys()).map((_, index) => {
      const semester = index + firstSemester
      const key = `${student.studentNumber}-${semester}`

      const enrollmenttype = studyright?.semesterEnrollments?.find(enrollment => enrollment.semester === semester)?.type
      const statutoryAbsence = studyright?.semesterEnrollments?.find(
        enrollment => enrollment.semester === semester
      )?.statutoryAbsence

      const { startdate, enddate, name: semesterName } = allSemesters[semester]
      const graduated = programme
        ? (() => {
            if (firstGraduation && dayjs(firstGraduation).isBetween(startdate, enddate))
              return 1 + 1 * Number(isMasters)
            if (secondGraduation && dayjs(secondGraduation).isBetween(startdate, enddate))
              return 2 - 1 * Number(isMasters)
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

  const getSemesterEnrollmentsVal = (studyright: CloseToGraduationData['studyright']) => {
    const enrollmentsToCount = studyright?.semesterEnrollments ?? []

    /* Enrolled as present or non-statutory absence will add to the count (should inactive count too?) */
    return enrollmentsToCount.reduce(
      (acc, cur) =>
        acc +
        Number(
          (cur.type === EnrollmentType.PRESENT || (cur.type === EnrollmentType.ABSENT && !cur.statutoryAbsence)) &&
            firstSemester <= cur.semester &&
            cur.semester <= lastSemester
        ),
      0
    )
  }

  return {
    getSemesterEnrollmentsContent,
    getSemesterEnrollmentsVal,
  }
}
