import type { DegreeProgrammeType, Name, Phase, StudyTrack } from '../types'

import type { SISStudyRight } from './SISStudyRight'

export type SISStudyRightElement = {
  id: string
  startDate: Date
  endDate: Date
  graduated: boolean
  phase: Phase
  studyRightId: string
  studyRight: SISStudyRight
  code: string
  name: Name
  studyTrack: StudyTrack | null
  degreeProgrammeType: DegreeProgrammeType
  createdAt: Date
  updatedAt: Date
}
