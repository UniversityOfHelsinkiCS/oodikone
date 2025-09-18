import type { Optional } from '../../types'

export type StudyGuidanceGroupTagCreation = Optional<StudyGuidanceGroupTag, 'id'>
export type StudyGuidanceGroupTag = {
  id?: string // Why is this optional? (is it?)
  studyGuidanceGroupId: string
  studyProgramme: string | null
  year: string | null
}
