import type { Optional } from '../../types'

export type StudyGuidanceGroupTagCreation = Optional<StudyGuidanceGroupTag, 'id'>
export type StudyGuidanceGroupTag = {
  id?: string
  studyGuidanceGroupId: string
  studyProgramme: string | null
  year: string | null
}
