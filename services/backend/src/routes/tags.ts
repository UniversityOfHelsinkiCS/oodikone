import { Request, Response, Router } from 'express'
import { difference } from 'lodash'

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

interface GetTagsByStudyTrackRequest extends Request {
  params: {
    studyTrack: string
  }
}

router.get('/tags/:studyTrack', async (req: GetTagsByStudyTrackRequest, res: Response) => {
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

interface PostTagRequest extends Request {
  body: { tag: NewTag }
}

router.post('/tags', async (req: PostTagRequest, res: Response) => {
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

interface DeleteTagRequest extends Request {
  body: { tag: Tag }
}

router.delete('/tags', async (req: DeleteTagRequest, res: Response) => {
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

interface GetStudentTagsByStudyTrackRequest extends Request {
  params: {
    studyTrack: string
  }
}

router.get('/studenttags/:studyTrack', async (req: GetStudentTagsByStudyTrackRequest, res: Response) => {
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
})

interface PostStudentTagsRequest extends Request {
  body: {
    combinedProgramme: string
    studentTags: StudentTag[]
    studyTrack: string
  }
}

router.post('/studenttags', async (req: PostStudentTagsRequest, res: Response) => {
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

interface DeleteStudentTagsRequest extends Request {
  body: {
    combinedProgramme: string
    tagId: string
    studentNumbers: string[]
    studyTrack: string
  }
}

router.delete('/studenttags', async (req: DeleteStudentTagsRequest, res: Response) => {
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
