import { SISStudyRight } from '@oodikone/shared/models'
import { FormattedStudent, Name } from '@oodikone/shared/types'
import { StudentData, StudentTags } from '@oodikone/shared/types/studentData'
import { dateDaysFromNow, dayInMilliseconds } from '@oodikone/shared/util/datetime'
import { hasTransferredFromOrToProgramme } from '../studyProgramme/studyProgrammeHelpers'
import type { StudentStudyRight } from './getStudentData'
import { getCurriculumVersion } from './shared'

const getTransferSource = (code: string, studyRights: StudentStudyRight[]): [boolean, string | undefined] => {
  if (code) {
    const correctStudyRight = studyRights.find(({ studyRightElements }) =>
      studyRightElements.some(element => element.code === code)
    )!
    const correctStudyRightElement = correctStudyRight?.studyRightElements?.find(element => element.code === code)

    if (correctStudyRight && correctStudyRightElement) {
      const studyRightStart = new Date(correctStudyRightElement?.startDate ?? 0)
      const studyRightStartDate = dateDaysFromNow(studyRightStart, -1)

      const [, hasTransferredToProgramme] = hasTransferredFromOrToProgramme(
        correctStudyRight as SISStudyRight,
        correctStudyRightElement
      )

      if (hasTransferredToProgramme) {
        const transferredFromProgramme = correctStudyRight.studyRightElements.find(element => {
          const otherStudyRightEndDate = new Date(element.endDate)

          return studyRightStartDate.getTime() - otherStudyRightEndDate.getTime() < dayInMilliseconds
        })?.code

        return [true, transferredFromProgramme]
      }
    }
  }

  return [false, undefined]
}

export const formatStudentForAPI = (
  code: string,
  startDate: string,
  student: StudentData,
  tags: StudentTags[],
  optionData: Name | undefined
): Omit<FormattedStudent, 'criteriaProgress' | 'courses' | 'enrollments'> => {
  const { studentnumber, studyRights, studyplans } = student

  const hops = studyplans.find(plan => plan.programme_code === code)
  const [transferredStudyright, transferSource] = getTransferSource(code, studyRights)

  return {
    firstnames: student.firstnames,
    lastname: student.lastname,
    started: student.dateofuniversityenrollment,
    studentNumber: studentnumber,
    credits: student.creditcount ?? 0,

    hopsCredits: hops?.completed_credits ?? 0,
    name: student.abbreviatedname,
    gender_code: student.gender_code,
    email: student.email,
    secondaryEmail: student.secondary_email,
    phoneNumber: student.phone_number,
    updatedAt: student.updatedAt,
    studyrightStart: startDate,
    option: optionData ?? null,
    birthdate: student.birthdate,
    sis_person_id: student.sis_person_id,
    citizenships: student.citizenships,
    curriculumVersion: getCurriculumVersion(hops?.curriculum_period_id),

    tags,
    transferredStudyright,
    transferSource,
    studyRights,
    studyplans,
  }
}
