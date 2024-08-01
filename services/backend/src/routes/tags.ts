import { Request, Response, Router } from 'express'
import { difference } from 'lodash'

import { Tag, TagStudent } from '../models/kone'
import { filterStudentnumbersByAccessrights } from '../services/students'
import {
  findTagsByStudyTrack,
  createNewTag,
  deleteTag,
  getStudentTagsByStudyTrack,
  createMultipleStudentTags,
  findTagsFromStudyTrackById,
  deleteMultipleStudentTags,
  TagFromFrontend,
  StudentTagFromFrontend,
} from '../services/tags'
import { Role } from '../types'
import { getFullStudyProgrammeRights, hasFullAccessToStudentData } from '../util'

const router = Router()

const filterRelevantTags = (tags: Tag[], userId: string) => {
  return tags.filter(tag => !tag.personal_user_id || tag.personal_user_id === userId)
}

const filterRelevantStudentTags = (studentTags: TagStudent[], userId: string) => {
  return studentTags.filter(({ tag }) => !tag.personal_user_id || tag.personal_user_id === userId)
}

const userIsUnauthorized = (programmeRights: string[], programmeCodes: string[], roles: Role[]) => {
  const lacksProgrammeAccess = programmeCodes.every(code => !programmeRights.includes(code))
  const hasFullAccess = hasFullAccessToStudentData(roles)
  return lacksProgrammeAccess && !hasFullAccess
}

const getProgrammeCodes = (studyTrack: string) => {
  if (studyTrack.includes('KH') && studyTrack.includes('MH')) {
    return studyTrack.split('-')
  }
  return [studyTrack]
}

const getStudyTrackCode = (studyTrack: string, combinedProgramme: string) => {
  return combinedProgramme ? `${studyTrack}-${combinedProgramme}` : studyTrack
}

interface GetTagsByStudyTrackRequest extends Request {
  params: {
    studytrack: string
  }
}

router.get('/tags/:studytrack', async (req: GetTagsByStudyTrackRequest, res: Response) => {
  const { studytrack } = req.params
  const { roles, id, programmeRights } = req.user
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const programmeCodes = getProgrammeCodes(studytrack)

  // Respond with null and 200 instead of 403 if the user isn't authorized to view the tags
  // This is to avoid unnecessary noise in Sentry
  if (userIsUnauthorized(fullStudyProgrammeRights, programmeCodes, roles)) {
    return res.json(null)
  }

  const tags = await findTagsByStudyTrack(studytrack)
  res.status(200).json(filterRelevantTags(tags, id))
})

interface PostTagRequest extends Request {
  body: {
    tag: TagFromFrontend
  }
}

router.post('/tags', async (req: PostTagRequest, res: Response) => {
  const {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    tag: { studytrack, tagname, year, personal_user_id },
  } = req.body
  const { roles, id, programmeRights } = req.user

  if (!tagname || !studytrack || !year) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const programmeCodes = getProgrammeCodes(studytrack)
  if (userIsUnauthorized(fullStudyProgrammeRights, programmeCodes, roles)) {
    return res.status(403).end()
  }

  await createNewTag({ studytrack, tagname, year, personal_user_id })
  const tags = await findTagsByStudyTrack(studytrack)
  res.status(200).json(filterRelevantTags(tags, id))
})

interface DeleteTagRequest extends Request {
  body: {
    tag: {
      studytrack: string
      tag_id: string
      personal_user_id: string
    }
  }
}

router.delete('/tags', async (req: DeleteTagRequest, res: Response) => {
  const { tag } = req.body
  const { roles, id, programmeRights } = req.user

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const programmeCodes = getProgrammeCodes(tag.studytrack)

  if (userIsUnauthorized(fullStudyProgrammeRights, programmeCodes, roles) && !(tag.personal_user_id === id)) {
    return res.status(403).end()
  }

  await deleteTag(tag.tag_id)
  const tags = await findTagsByStudyTrack(tag.studytrack)
  res.status(200).json(filterRelevantTags(tags, id))
})

interface GetStudentTagsByStudyTrackRequest extends Request {
  params: {
    studytrack: string
  }
}

router.get('/studenttags/:studytrack', async (req: GetStudentTagsByStudyTrackRequest, res: Response) => {
  const { studytrack } = req.params
  const { roles, id, programmeRights } = req.user

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const programmeCodes = getProgrammeCodes(studytrack)
  const lacksProgrammeAccess = programmeCodes.every(code => !fullStudyProgrammeRights.includes(code))
  if (lacksProgrammeAccess && !roles?.includes('admin')) {
    return res.json(null)
  }

  const tags = await getStudentTagsByStudyTrack(studytrack)
  res.status(200).json(filterRelevantStudentTags(tags, id))
})

interface PostStudentTagsRequest extends Request {
  body: {
    tags: StudentTagFromFrontend[]
    studytrack: string
    combinedProgramme: string
  }
}

router.post('/studenttags', async (req: PostStudentTagsRequest, res: Response) => {
  const { tags, studytrack, combinedProgramme } = req.body
  const { roles, programmeRights } = req.user

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  if (userIsUnauthorized(fullStudyProgrammeRights, [studytrack, combinedProgramme], roles)) {
    return res.status(403).end()
  }

  const studyTrackCode = getStudyTrackCode(studytrack, combinedProgramme)
  const existingTags = await findTagsByStudyTrack(studyTrackCode)
  const existingTagids = existingTags.map(tag => tag.tag_id)
  const tagIds = [...new Set(tags.map(tag => tag.tag_id))]
  if (!tagIds.find(tag => existingTagids.includes(tag))) {
    return res.status(400).json({ error: 'The tag does not exist' })
  }

  const studentNumbers = tags.map(tag => tag.studentnumber)
  const studentFromProgrammes = combinedProgramme ? [studytrack, combinedProgramme] : [studytrack]
  const students = await filterStudentnumbersByAccessrights(studentNumbers, studentFromProgrammes)
  const missingStudents = difference(studentNumbers, students)
  if (missingStudents.length !== 0) {
    const errorMessage = `Could not find the following students from the programme: ${missingStudents.join(', ')}`
    return res.status(400).json({ error: errorMessage })
  }

  await createMultipleStudentTags(tags)
  res.status(204).end()
})

interface DeleteStudentTagsRequest extends Request {
  body: {
    tagId: string
    studentnumbers: string[]
    studytrack: string
    combinedProgramme: string
  }
}

router.delete('/studenttags', async (req: DeleteStudentTagsRequest, res: Response) => {
  const { tagId, studentnumbers, studytrack, combinedProgramme } = req.body
  const { roles, programmeRights } = req.user

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  if (userIsUnauthorized(fullStudyProgrammeRights, [studytrack, combinedProgramme], roles)) {
    return res.status(403).end()
  }

  const studyTrackCode = getStudyTrackCode(studytrack, combinedProgramme)
  const tags = await findTagsFromStudyTrackById(studyTrackCode, [tagId])
  if (tags.length === 0) {
    return res.status(403).json({ error: 'The tag does not exist' })
  }

  await deleteMultipleStudentTags(tagId, studentnumbers)
  res.status(204).end()
})

export default router
