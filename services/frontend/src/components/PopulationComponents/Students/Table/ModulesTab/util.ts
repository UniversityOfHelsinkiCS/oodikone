import { formatISODate } from '@/util/timeAndDate'
import { FormattedStudent as Student } from '@oodikone/shared/types'

export type StudyModuleData = { code: string; completed: boolean; completionDate: string | null }

const getRelevantStudyplan = (student: Student, degreeProgrammeCodes: string[]) => {
  if (!student.studyRights || !Array.isArray(student.studyRights)) return undefined

  const relevantStudyRight = student.studyRights.find(studyRight =>
    studyRight.studyRightElements.some(element => degreeProgrammeCodes.includes(element.code))
  )
  if (!relevantStudyRight) return undefined

  return student.studyplans.find(
    plan => plan.sis_study_right_id === relevantStudyRight.id && degreeProgrammeCodes.includes(plan.programme_code)
  )
}

export const getStudyplanModules = (
  student: Student,
  degreeProgrammeCodes: string[],
  curriculumModuleCodeByGroupId: Map<string, string>
): StudyModuleData[] =>
  (getRelevantStudyplan(student, degreeProgrammeCodes)?.courses ?? []).flatMap(({ groupId, isStudyModule }) => {
    const code = isStudyModule ? curriculumModuleCodeByGroupId.get(groupId) : undefined
    if (!code) return []

    const completion = student.courses.find(course => course.courseGroupId === groupId && course.passed)
    return [{ code, completed: !!completion, completionDate: completion ? formatISODate(completion.date) : null }]
  })
