import dayjs from 'dayjs'

import { getAllProgrammesOfStudent, isFall } from '@/common'
import { SemestersData, useGetSemestersQuery } from '@/redux/semesters'

import { DegreeProgrammeType, EnrollmentType, type FormattedStudent as Student } from '@oodikone/shared/types'
import { StudentStudyRight } from '@oodikone/shared/types/studentData'

export const useGetRelevantSemesterData = (
  year: number | undefined | null
):
  | {
      isSuccess: false
      data: null
    }
  | {
      isSuccess: true
      data: {
        currentSemester: SemestersData['currentSemester']
        allSemesters: SemestersData['semesters']

        firstSemester: number
        lastSemester: number
      }
    } => {
  const { isSuccess, data: semesters } = useGetSemestersQuery()

  if (!isSuccess) return { data: null, isSuccess }

  const { currentSemester, semesters: allSemesters } = semesters
  const [firstSemester, lastSemester] = getFirstAndLastSemester(semesters, year)

  return {
    isSuccess,
    data: {
      currentSemester,
      allSemesters,

      firstSemester,
      lastSemester,
    },
  }
}

/*
 * NOTE: Developer HAS to make sure that useGetSemesters has cached data before this call
 */
const getFirstAndLastSemester = (semesters: SemestersData, year: number | undefined | null): [number, number] => {
  const { semesters: allSemesters, currentSemester } = semesters
  const { semestercode: currentSemesterCode } = currentSemester ?? { semestercode: 0 }

  const lastSemester = currentSemesterCode + 1 * Number(isFall(currentSemesterCode))

  const firstSemester = year
    ? (Object.values(allSemesters).find(
        semester => new Date(semester.startdate).getTime() === new Date(Date.UTC(year, 7, 1)).getTime()
      )?.semestercode ?? lastSemester)
    : lastSemester - 13

  return [firstSemester, lastSemester]
}

export const getSemesterEnrollmentsContent =
  ({
    getTextIn,

    programme,
    isMastersProgramme,
    allSemesters,
    lastSemester,
    firstSemester,
  }: {
    getTextIn: (arg0: any) => string | undefined | null
    programme: string
    isMastersProgramme: boolean
    allSemesters: SemestersData['semesters']
    lastSemester: number
    firstSemester: number
  }) =>
  (
    student: { studentNumber: string; studyrightEnd: Date | null; secondStudyrightEnd: Date | null },
    studyright: StudentStudyRight | undefined
  ) => {
    if (!studyright) return []
    const { studentNumber, studyrightEnd, secondStudyrightEnd } = student

    const firstGraduation = studyrightEnd
    const secondGraduation = secondStudyrightEnd

    return Array.from(Array(lastSemester - firstSemester + 1).keys()).map((_, index) => {
      const semester = index + firstSemester
      const key = `${studentNumber}-${semester}`

      const currentSemesterEnrollment = studyright?.semesterEnrollments?.find(
        enrollment => enrollment.semester === semester
      )

      const enrollmenttype = currentSemesterEnrollment?.type
      const statutoryAbsence = currentSemesterEnrollment?.statutoryAbsence

      const { startdate, enddate, name: semesterName } = allSemesters[semester]
      const graduated = programme
        ? (() => {
            const mastersAsNumber = Number(isMastersProgramme)

            if (firstGraduation && dayjs(firstGraduation).isBetween(startdate, enddate)) return 1 + mastersAsNumber
            if (secondGraduation && dayjs(secondGraduation).isBetween(startdate, enddate)) return 2 - mastersAsNumber
            return 0
          })()
        : 0

      const typeText = (() => {
        switch (enrollmenttype) {
          case EnrollmentType.PRESENT:
            return 'Enrolled as present'
          case EnrollmentType.ABSENT:
            return statutoryAbsence ? 'Enrolled as absent (statutory)' : 'Enrolled as absent'
          case EnrollmentType.PASSIVE:
            return 'Not enrolled'
          default:
            return 'No study right'
        }
      })()

      const typeLabel = (() => {
        switch (enrollmenttype) {
          case EnrollmentType.PRESENT:
            return 'present'
          case EnrollmentType.ABSENT:
            return statutoryAbsence ? 'absent-statutory' : 'absent'
          case EnrollmentType.PASSIVE:
            return 'passive'
          default:
            return 'none'
        }
      })()

      const graduationText = graduated ? `(graduated as ${graduated === 1 ? 'Bachelor' : 'Master'})` : ''
      const onHoverString = `${typeText} in ${getTextIn(semesterName)} ${graduationText}`

      const graduationCrown = graduated ? (graduated === 2 ? 'graduated-higher' : 'graduated') : ''

      return { key, onHoverString, typeLabel, graduationCrown }
    })
  }

export const getProgrammeDetails =
  ({
    programme,
    isMastersProgramme,
    combinedProgramme,
    showBachelorAndMaster,

    currentSemester,
    year,
  }: {
    programme: string | undefined
    isMastersProgramme: boolean
    combinedProgramme?: string
    showBachelorAndMaster?: boolean
    currentSemester: SemestersData['currentSemester'] | null
    year: number | null
  }) =>
  (student: Student) => {
    const studentProgrammes = getAllProgrammesOfStudent(student.studyRights ?? [], currentSemester?.semestercode ?? 0)

    const primaryProgramme = programme
      ? studentProgrammes.find(sp => sp.code === programme)
      : studentProgrammes.find(({ active }) => !!active)
    const primaryStudyplan = student.studyplans?.find(({ programme_code }) => programme_code === primaryProgramme?.code)

    // Programme can be an empty string, so direct ?? comparison wont work
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const relevantProgrammeCode = (programme || primaryProgramme?.code) ?? ''

    const yearMatching = startDate =>
      !year || dayjs(startDate).isBetween(`${year}-08-01`, `${Number(year) + 1}-07-31`, 'day', '[]')

    const relevantStudyRight = student.studyRights.find(({ studyRightElements }) =>
      studyRightElements.some(({ code, startDate }) => code === relevantProgrammeCode && yearMatching(startDate))
    )

    const relevantStudyRightElement = relevantStudyRight?.studyRightElements.find(
      ({ code, startDate }) => code === relevantProgrammeCode && yearMatching(startDate)
    )

    const secondaryStudyplan = student.studyplans?.find(({ sis_study_right_id, programme_code }) => {
      if (combinedProgramme) return programme_code === combinedProgramme

      return sis_study_right_id === relevantStudyRight?.id && programme_code !== primaryStudyplan?.programme_code
    })

    const degreeProgrammeTypeToCheck =
      !!relevantStudyRightElement && !isMastersProgramme ? DegreeProgrammeType.MASTER : DegreeProgrammeType.BACHELOR

    const relevantSecondaryStudyRightElement = (relevantStudyRight?.studyRightElements ?? [])
      .filter(element => {
        if (combinedProgramme) return element.code === combinedProgramme
        if (showBachelorAndMaster && !!relevantStudyRightElement)
          return element.degreeProgrammeType === degreeProgrammeTypeToCheck

        return false
      })
      .sort(({ startDate: a }, { startDate: b }) => Number(b < a) * 1 + Number(a < b) * -1)
      ?.at(0)

    return {
      allProgrammes: studentProgrammes,
      primaryProgramme,
      primaryStudyplan,
      secondaryStudyplan,

      relevantStudyRight,
      relevantStudyRightElement,
      relevantSecondaryStudyRightElement,
    }
  }
