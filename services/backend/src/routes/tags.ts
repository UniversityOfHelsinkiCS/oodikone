import { Router } from 'express'
import { difference } from 'lodash'

import { CanError } from '@oodikone/shared/routes'
import { NewTag, Role, StudentTag, Tag } from '@oodikone/shared/types'
import { filterStudentNumbersByAccessRights } from '../services/students'
import {
  findTagsByStudyTrack,
  createNewTag,
  deleteTag,
  getStudentTagsByStudyTrack,
  createMultipleStudentTags,
  findTagsFromStudyTrackById,
  deleteMultipleStudentTags,
} from '../services/tags'
import { getFullStudyProgrammeRights, hasFullAccessToStudentData } from '../util'

const router = Router()

const filterRelevantTags = (tags: Tag[], userId: string) => {
  return tags.filter(tag => !tag.personalUserId || tag.personalUserId === userId)
}

const filterRelevantStudentTags = (studentTags: StudentTag[], userId: string) => {
  return studentTags.filter(({ tag }) => !tag?.personalUserId || tag.personalUserId === userId)
}

const userIsUnauthorized = (programmeRights: string[], programmeCodes: string[], roles: Role[]) => {
  const lacksProgrammeAccess = programmeCodes.every(code => !programmeRights.includes(code))
  const hasFullAccess = hasFullAccessToStudentData(roles)
  return lacksProgrammeAccess && !hasFullAccess
}

const getProgrammeCodes = (studyTrack: string) => (studyTrack.includes('-') ? studyTrack.split('-') : [studyTrack])

const getStudyTrackCode = (studyTrack: string, combinedProgramme: string) => {
  return combinedProgramme ? `${studyTrack}-${combinedProgramme}` : studyTrack
}

export type GetTagsByStudyTrackParams = { studyTrack: string }
export type GetTagsByStudyTrackResBody = Tag[] | null

router.get<GetTagsByStudyTrackParams, GetTagsByStudyTrackResBody>('/tags/:studyTrack', async (req, res) => {
  const { studyTrack } = req.params
  const { roles, id, programmeRights } = req.user
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const programmeCodes = getProgrammeCodes(studyTrack)

  // Respond with null and 200 instead of 403 if the user isn't authorized to view the tags
  // This is to avoid unnecessary noise in Sentry
  if (userIsUnauthorized(fullStudyProgrammeRights, programmeCodes, roles)) {
    return res.json(null)
  }

  const tags = await findTagsByStudyTrack(studyTrack)
  res.status(200).json(filterRelevantTags(tags, id))
})

export type PostTagResBody = CanError<Tag[] | void>
export type PostTagReqBody = { tag: NewTag }

router.post<never, PostTagResBody, PostTagReqBody>('/tags', async (req, res) => {
  const {
    tag: { name, personalUserId, studyTrack, year },
  } = req.body
  const { roles, id, programmeRights } = req.user

  if (!name || !studyTrack) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const programmeCodes = getProgrammeCodes(studyTrack)
  if (userIsUnauthorized(fullStudyProgrammeRights, programmeCodes, roles)) {
    return res.status(403).end()
  }

  await createNewTag({ name, personalUserId, studyTrack, year })
  const tags = await findTagsByStudyTrack(studyTrack)
  res.status(200).json(filterRelevantTags(tags, id))
})

export type DeleteTagResBody = Tag[] | void
export type DeleteTagReqBody = { tag: Tag }

router.delete<never, DeleteTagResBody, DeleteTagReqBody>('/tags', async (req, res) => {
  const {
    tag: { id, personalUserId, studyTrack },
  } = req.body
  const { roles, id: userId, programmeRights } = req.user

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const programmeCodes = getProgrammeCodes(studyTrack)

  if (userIsUnauthorized(fullStudyProgrammeRights, programmeCodes, roles) && !(personalUserId === userId)) {
    return res.status(403).end()
  }

  await deleteTag(id)
  const tags = await findTagsByStudyTrack(studyTrack)
  res.status(200).json(filterRelevantTags(tags, id))
})

export type GetStudentTagsByStudyTrackParams = { studyTrack: string }
export type GetStudentTagsByStudyTrackResBody = StudentTag[] | null

router.get<GetStudentTagsByStudyTrackParams, GetStudentTagsByStudyTrackResBody>(
  '/studenttags/:studyTrack',
  async (req, res) => {
    const { studyTrack } = req.params
    const { roles, id, programmeRights } = req.user

    const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
    const programmeCodes = getProgrammeCodes(studyTrack)
    const lacksProgrammeAccess = programmeCodes.every(code => !fullStudyProgrammeRights.includes(code))
    if (lacksProgrammeAccess && !roles?.includes('admin')) {
      return res.json(null)
    }

    const tags = await getStudentTagsByStudyTrack(studyTrack)
    const relevantTags = filterRelevantStudentTags(tags, id)
    res.status(200).json(relevantTags)
  }
)

export type PostStudentTagsResBody = CanError<void>
export type PostStudentTagsReqBody = {
  combinedProgramme: string
  studentTags: StudentTag[]
  studyTrack: string
}

router.post<never, PostStudentTagsResBody, PostStudentTagsReqBody>('/studenttags', async (req, res) => {
  const { combinedProgramme, studentTags, studyTrack } = req.body
  const { roles, programmeRights } = req.user

  if (!studentTags || !studyTrack) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  if (userIsUnauthorized(fullStudyProgrammeRights, [studyTrack, combinedProgramme], roles)) {
    return res.status(403).end()
  }

  const studyTrackCode = getStudyTrackCode(studyTrack, combinedProgramme)
  const existingTags = await findTagsByStudyTrack(studyTrackCode)
  const existingTagIds = existingTags.map(tag => tag.id)
  const tagIds = [...new Set(studentTags.map(studentTag => studentTag.tagId))]
  if (!tagIds.find(tag => existingTagIds.includes(tag))) {
    return res.status(400).json({ error: 'The tag does not exist' })
  }

  const studentNumbers = studentTags.map(studentTag => studentTag.studentNumber)
  const studentFromProgrammes = combinedProgramme ? [studyTrack, combinedProgramme] : [studyTrack]
  const students = await filterStudentNumbersByAccessRights(studentNumbers, studentFromProgrammes)
  const missingStudents = difference(studentNumbers, students)
  if (missingStudents.length !== 0) {
    const errorMessage = `Could not find the following students from the programme: ${missingStudents.join(', ')}`
    return res.status(400).json({ error: errorMessage })
  }

  await createMultipleStudentTags(studentTags)
  res.status(204).end()
})

export type DeleteStudentTagsResBody = CanError<void>
export type DeleteStudentTagsReqBody = {
  combinedProgramme: string
  tagId: string
  studentNumbers: string[]
  studyTrack: string
}

router.delete<never, DeleteStudentTagsResBody, DeleteStudentTagsReqBody>('/studenttags', async (req, res) => {
  const { combinedProgramme, tagId, studentNumbers, studyTrack } = req.body
  const { roles, programmeRights } = req.user

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  if (userIsUnauthorized(fullStudyProgrammeRights, [studyTrack, combinedProgramme], roles)) {
    return res.status(403).end()
  }

  const studyTrackCode = getStudyTrackCode(studyTrack, combinedProgramme)
  const tags = await findTagsFromStudyTrackById(studyTrackCode, [tagId])
  if (tags.length === 0) {
    return res.status(403).json({ error: 'The tag does not exist' })
  }

  await deleteMultipleStudentTags(tagId, studentNumbers)
  res.status(204).end()
})

export default router
