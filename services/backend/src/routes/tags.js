const router = require('express').Router()
const Tags = require('../services/tags')
const TagStudent = require('../services/tagstudent')
const Students = require('../services/students')
const { difference } = require('lodash')

const filterRelevantTags = (tags, userId) => {
  return tags.filter(tag => !tag.personal_user_id || tag.personal_user_id === userId)
}

const filterRelevantStudentTags = (studentTags, userId) => {
  return studentTags.filter(({ tag }) => !tag.personal_user_id || tag.personal_user_id === userId)
}

router.get('/tags', async (_req, res) => {
  const tags = await Tags.findTags()
  res.status(200).json(tags)
})

router.get('/tags/:studytrack', async (req, res) => {
  const { studytrack } = req.params
  const {
    user: { rights, roles, id },
  } = req
  const programmeCodes = studytrack.includes('KH') && studytrack.includes('MH') ? studytrack.split('-') : [studytrack]
  if (!rights.includes(programmeCodes[0]) && !rights.includes(programmeCodes[1]) && !roles?.includes('admin'))
    return res.status(403).end()

  const tags = await Tags.findTagsByStudytrack(studytrack)
  res.status(200).json(filterRelevantTags(tags, id))
})

router.post('/tags', async (req, res) => {
  const {
    tag: { studytrack, tagname, year, personal_user_id },
  } = req.body
  const {
    user: { rights, roles, id },
  } = req

  const programmeCodes = studytrack.includes('KH') && studytrack.includes('MH') ? studytrack.split('-') : [studytrack]
  if (!rights.includes(programmeCodes[0]) && !rights.includes(programmeCodes[1]) && !roles?.includes('admin'))
    return res.status(403).end()

  await Tags.createNewTag({ studytrack, tagname, year, personal_user_id })
  const tags = await Tags.findTagsByStudytrack(studytrack)
  res.status(200).json(filterRelevantTags(tags, id))
})

router.delete('/tags', async (req, res) => {
  const { tag } = req.body
  const {
    user: { rights, roles, id },
  } = req

  const programmeCodes =
    tag.studytrack.includes('KH') && tag.studytrack.includes('MH') ? tag.studytrack.split('-') : [tag.studytrack]

  if (
    !rights.includes(programmeCodes[0]) &&
    !rights.includes(programmeCodes[1]) &&
    !roles?.includes('admin') &&
    !(tag.personal_user_id === id)
  )
    return res.status(403).end()

  await Tags.deleteTag(tag)
  const t = await Tags.findTagsByStudytrack(tag.studytrack)
  res.status(200).json(filterRelevantTags(t, id))
})

router.get('/studenttags', async (req, res) => {
  const result = await TagStudent.getStudentTags()
  res.status(200).json(result)
})

router.get('/studenttags/:studytrack', async (req, res) => {
  const { studytrack } = req.params
  const {
    user: { rights, roles, id },
  } = req

  const programmeCodes = studytrack.includes('KH') && studytrack.includes('MH') ? studytrack.split('-') : [studytrack]
  if (!rights.includes(programmeCodes[0]) && !rights.includes(programmeCodes[1]) && !roles?.includes('admin'))
    return res.status(403).end()

  const result = await TagStudent.getStudentTagsByStudytrack(studytrack)
  res.status(200).json(filterRelevantStudentTags(result, id))
})

router.get('/studenttags/:studentnumber', async (req, res) => {
  const { studentnumber } = req.params
  const { user } = req
  const result = await TagStudent.getStudentTagsByStudentnumber(studentnumber)
  res.status(200).json(filterRelevantStudentTags(result, user.id))
})

router.post('/studenttags/:studentnumber', async (req, res) => {
  const { tag, studytrack, combinedProgramme } = req.body
  const {
    user: { roles, rights, id },
  } = req

  if (!rights.includes(studytrack) && !rights.includes(combinedProgramme) && !roles?.includes('admin'))
    return res.status(403).end()

  await TagStudent.createStudentTag(tag)
  const studytrackCode = combinedProgramme ? `${studytrack}-${combinedProgramme}` : studytrack
  const result = await TagStudent.getStudentTagsByStudytrack(studytrackCode)
  res.status(200).json(filterRelevantStudentTags(result, id))
})

router.post('/studenttags', async (req, res) => {
  const { tags, studytrack, combinedProgramme } = req.body
  const {
    user: { rights, roles, id },
  } = req

  if (!rights.includes(studytrack) && !rights.includes(combinedProgramme) && !roles?.includes('admin'))
    return res.status(403).end()

  const studytrackCode = combinedProgramme ? `${studytrack}-${combinedProgramme}` : studytrack
  const existingTags = await Tags.findTagsByStudytrack(studytrackCode)
  const existingTagids = existingTags.map(t => t.tag_id)
  const tagids = [...new Set(tags.map(t => t.tag_id))]
  if (!tagids.find(t => existingTagids.includes(t))) return res.status(400).json({ error: 'The tag does not exist' })

  const studentnumbers = tags.map(t => t.studentnumber)
  const studentFromProgrammes = combinedProgramme ? [studytrack, combinedProgramme] : [studytrack]
  const students = await Students.filterStudentnumbersByAccessrights(studentnumbers, studentFromProgrammes)
  const missingStudents = difference(studentnumbers, students)
  if (missingStudents.length !== 0)
    return res
      .status(400)
      .json({ error: `Could not find the following students from the programme: ${missingStudents.join(', ')}` })

  await TagStudent.createMultipleStudentTags(tags)
  const result = await TagStudent.getStudentTagsByStudytrack(studytrackCode)
  res.status(200).json(filterRelevantStudentTags(result, id))
})

router.delete('/studenttags/delete_one', async (req, res) => {
  const { tag_id, studentnumber, studytrack, combinedProgramme } = req.body
  const {
    user: { rights, roles, id },
  } = req

  if (!rights.includes(studytrack) && !rights.includes(combinedProgramme) && !roles?.includes('admin'))
    return res.status(403).end()
  const studytrackCode = combinedProgramme ? `${studytrack}-${combinedProgramme}` : studytrack
  const tags = await Tags.findTagsFromStudytrackById(studytrackCode, [tag_id])
  if (tags.length === 0) return res.status(403).json({ error: 'The tag does not exist' })

  await TagStudent.deleteStudentTag(studentnumber, tag_id)
  const result = await TagStudent.getStudentTagsByStudytrack(studytrackCode)
  res.status(200).json(filterRelevantStudentTags(result, id))
})

router.delete('/studenttags/delete_many', async (req, res) => {
  const { tagId, studentnumbers, studytrack, combinedProgramme } = req.body
  const {
    user: { rights, roles, id },
  } = req

  if (!rights.includes(studytrack) && !rights.includes(combinedProgramme) && !roles?.includes('admin'))
    return res.status(403).end()
  const studytrackCode = combinedProgramme ? `${studytrack}-${combinedProgramme}` : studytrack
  const tags = await Tags.findTagsFromStudytrackById(studytrackCode, [tagId])
  if (tags.length === 0) return res.status(403).json({ error: 'The tag does not exist' })

  await TagStudent.deleteMultipleStudentTags(tagId, studentnumbers)
  const result = await TagStudent.getStudentTagsByStudytrack(studytrackCode)
  res.status(200).json(filterRelevantStudentTags(result, id))
})

module.exports = router
