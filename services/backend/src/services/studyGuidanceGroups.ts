import * as Sentry from '@sentry/node'
import { AxiosError } from 'axios'
import { uniq } from 'lodash'

import { StudyGuidanceGroupTag } from '../models/kone'
import { Name } from '../shared/types'
import { getImporterClient } from '../util/importerClient'
import logger from '../util/logger'

const importerClient = getImporterClient()

type ValidityPeriod = { startDate?: string; endDate?: string }

type ResponsibilityInfo = {
  text: string | null
  roleUrn: string
  personId: string
  validityPeriod: ValidityPeriod
}

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

type StudyGuidanceGroup = {
  id: string
  name: Name
  responsibilityInfos: ResponsibilityInfo[]
  type: string
  createdAt: string
  updatedAt: string
  members: Member[]
}

const getGroupsFromImporter = async (sisPersonId: string) => {
  if (!importerClient || !sisPersonId) {
    return []
  }
  const answerTimeout = new Promise(resolve => setTimeout(resolve, 2000))
  try {
    const response = (await Promise.race([
      importerClient.get(`/person-groups/person/${sisPersonId}`),
      answerTimeout,
    ])) as { data: Record<string, StudyGuidanceGroup> }
    if (!response) {
      return []
    }
    const studyGuidanceGroups: StudyGuidanceGroup[] = Object.values(response.data)
    return studyGuidanceGroups
  } catch (error) {
    logger.error("Couldn't fetch users study guidance groups")
    if (error instanceof AxiosError) {
      logger.error(error.stack)
      logger.error(JSON.stringify(error.response?.data))
      Sentry.captureException(error)
    }
    return []
  }
}

type Tags = { studyProgramme?: string | null; year?: string | null }

type TagsByGroupId = {
  [groupId: string]: Tags
}

type GroupsWithTags = StudyGuidanceGroup & { tags: Tags }

export const getAllGroupsAndStudents = async (sisPersonId: string) => {
  const tags = await StudyGuidanceGroupTag.findAll()
  const tagsByGroupId = tags.reduce((acc, curr) => {
    const { studyProgramme, year, studyGuidanceGroupId } = curr
    acc[studyGuidanceGroupId] = { studyProgramme, year }
    return acc
  }, {} as TagsByGroupId)
  const groups = await getGroupsFromImporter(sisPersonId)
  const groupsWithTags = groups.map(group => ({
    ...group,
    tags: tagsByGroupId[group.id],
  })) as GroupsWithTags[]
  return groupsWithTags
}

export const getAllStudentsUserHasInGroups = async (sisPersonId: string) => {
  const students = (await getGroupsFromImporter(sisPersonId))
    .map(group => group.members)
    .flat()
    .map(member => member.personStudentNumber)
  return uniq(students)
}

const getTagToUpdate = (studyProgramme?: string | null, year?: string | null) => {
  if (studyProgramme || studyProgramme === null) {
    return { studyProgramme }
  }
  return { year }
}

export const changeGroupTags = async (groupId: string, tags: Tags) => {
  const { studyProgramme, year } = tags
  const tagToUpdate = getTagToUpdate(studyProgramme, year)

  const [result] = await StudyGuidanceGroupTag.upsert({
    studyGuidanceGroupId: groupId,
    ...tagToUpdate,
  })
  return result
}

export const checkStudyGuidanceGroupsAccess = async (hyPersonSisuId: string) => {
  return (await getGroupsFromImporter(hyPersonSisuId)).length > 0
}
