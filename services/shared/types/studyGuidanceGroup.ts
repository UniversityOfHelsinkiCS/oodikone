import { Name } from './name'

type ValidityPeriod = { startDate?: string; endDate?: string }

type Member = {
  id: string
  personGroupId: string
  personGroupName: Name
  personId: string
  personFirstNames: string
  personLastName: string
  personStudentNumber: string
  validityPeriod: ValidityPeriod
  personPrimaryEmail: string
}

type ResponsibilityInfo = {
  text: string | null
  roleUrn: string
  personId: string
  validityPeriod: ValidityPeriod
}

export type Tags = { studyProgramme?: string | null; year?: string | null }

export type TagsByGroupId = Record<string, Tags>

export type StudyGuidanceGroup = {
  id: string
  name: Name
  responsibilityInfos: ResponsibilityInfo[]
  type: string
  createdAt: string
  updatedAt: string
  members: Member[]
}

export type GroupsWithTags = StudyGuidanceGroup & { tags: Tags }
