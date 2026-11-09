import type { SISStudyRight, SISStudyRightElement, Studyplan } from '@oodikone/shared/models'
import { DegreeProgrammeType } from '@oodikone/shared/types'
import { now } from '../../util/clock'

export const CLOSE_TO_GRADUATION_CREDITS_BY_DEGREE_TYPE: Partial<Record<DegreeProgrammeType, number>> = {
  [DegreeProgrammeType.BACHELOR]: 140,
  [DegreeProgrammeType.MASTER]: 70,
}

// Exceptions
export const CLOSE_TO_GRADUATION_CREDITS_BY_PROGRAMME: Record<string, number> = {
  MH30_001: 330, // Degree Programme in Medicine
  MH30_003: 300, // Degree Programme in Dentistry
  MH30_004: 115, // Master's Programme in Psychology
  MH90_001: 150, // Degree Programme in Veterinary Medicine
}

export const getCloseToGraduationCreditThreshold = (
  programmeCode: string,
  degreeProgrammeType: DegreeProgrammeType | null | undefined
): number | null =>
  CLOSE_TO_GRADUATION_CREDITS_BY_PROGRAMME[programmeCode] ??
  (degreeProgrammeType ? CLOSE_TO_GRADUATION_CREDITS_BY_DEGREE_TYPE[degreeProgrammeType] : undefined) ??
  null

export const isCloseToGraduation = ({
  studyRight,
  studyRightElement,
}: {
  studyRight: Pick<SISStudyRight, 'cancelled'> & { studyPlans?: Array<Pick<Studyplan, 'completed_credits'>> }
  studyRightElement: Pick<SISStudyRightElement, 'code' | 'degreeProgrammeType' | 'graduated' | 'endDate'>
}) => {
  if (studyRight.cancelled || studyRightElement.graduated) return false
  if (new Date(studyRightElement.endDate).getTime() < now().getTime()) return false

  const threshold = getCloseToGraduationCreditThreshold(studyRightElement.code, studyRightElement.degreeProgrammeType)
  if (threshold === null) return false

  return (studyRight.studyPlans ?? []).some(studyPlan => studyPlan.completed_credits >= threshold)
}
