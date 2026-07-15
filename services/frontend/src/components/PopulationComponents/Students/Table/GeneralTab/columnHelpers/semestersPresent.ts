import { isFall, isMastersProgramme } from '@/common'
import type { GetTextIn } from '@/components/LanguagePicker/useLanguage'
import { getSemesterEnrollmentsContent } from '@/components/PopulationComponents/Students/Table/GeneralTab/format/util'
import type { SemestersData } from '@/hooks/useSemesters'

import './semestersPresent.css'
import type { CloseToGraduationData } from '@oodikone/shared/routes/populations'
import { EnrollmentType } from '@oodikone/shared/types'

export const getSemestersPresentFunctions = ({
  getTextIn,
  programme,
  year,
  semestersToAddToStart,
  semesters,
}: {
  getTextIn: GetTextIn
  programme: string | null
  year: number
  semestersToAddToStart: number | null
  semesters: SemestersData
}) => {
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

  const getSemesterEnrollmentsContentProxy = getSemesterEnrollmentsContent({
    getTextIn,
    programme: programme ?? '',
    isMastersProgramme: isMastersProgramme(programme ?? ''),
    allSemesters,
    lastSemester,
    firstSemester,
  })

  const getSemesterEnrollmentsVal = (studyright: CloseToGraduationData['studyright']) => {
    const enrollmentsToCount = studyright?.semesterEnrollments ?? []

    /* Enrolled as present or non-statutory absence will add to the count (should passive count too?) */
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
    getSemesterEnrollmentsContent: getSemesterEnrollmentsContentProxy,
    getSemesterEnrollmentsVal,
  }
}
