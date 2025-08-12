import * as Sentry from '@sentry/node'
import { AxiosError } from 'axios'
import { uniq } from 'lodash'

import type { StudyGuidanceGroup, Tags, TagsByGroupId, GroupsWithTags } from '@oodikone/shared/types/studyGuidanceGroup'
import { StudyGuidanceGroupTagModel } from '../models/kone'
import { getImporterClient } from '../util/importerClient'
import logger from '../util/logger'

const importerClient = getImporterClient()

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

export const getAllGroupsAndStudents = async (sisPersonId: string) => {
  const tags = await StudyGuidanceGroupTagModel.findAll()
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

  const [result] = await StudyGuidanceGroupTagModel.upsert({
    studyGuidanceGroupId: groupId,
    ...tagToUpdate,
  })
  return result
}

export const checkStudyGuidanceGroupsAccess = async (hyPersonSisuId: string) => {
  return (await getGroupsFromImporter(hyPersonSisuId)).length > 0
}
