const { getImporterClient } = require('../util/importerClient')

const importerClient = getImporterClient()
const { StudyGuidanceGroupTag } = require('../models/models_kone')
const logger = require('../util/logger')
const _ = require('lodash')

const getGroupsFromImporter = async sisPersonId => {
  if (!importerClient) {
    return []
  }
  const answerTimeout = new Promise(resolve => setTimeout(resolve, 2000))
  try {
    const result = await Promise.race([importerClient.get(`/person-groups/person/${sisPersonId}`), answerTimeout])
    if (!result) return []
    return Object.values(result.data)
  } catch (error) {
    logger.error("Couldn't fetch users studyguidance groups")
    return []
  }
}

const getAllGroupsAndStudents = async sisPersonId => {
  const tagsByGroupId = (await StudyGuidanceGroupTag.findAll()).reduce((acc, curr) => {
    const { studyProgramme, year, studyGuidanceGroupId } = curr
    return { ...acc, [studyGuidanceGroupId]: { studyProgramme, year } }
  }, {})
  return (await getGroupsFromImporter(sisPersonId)).map(group => ({
    ...group,
    tags: tagsByGroupId[group.id],
  }))
}

const getAllStudentsUserHasInGroups = async sisPersonId =>
  _.uniqBy(
    (await getGroupsFromImporter(sisPersonId))
      .map(group => group.members)
      .flat()
      .map(member => member.personStudentNumber)
  )

const getTagToUpdate = (studyProgramme, year) => {
  if (studyProgramme || studyProgramme === null) {
    return { studyProgramme }
  }
  return { year }
}

const changeGroupTags = async ({ groupId, tags }) => {
  const { studyProgramme, year } = tags
  const tagToUpdate = getTagToUpdate(studyProgramme, year)

  const [result] = await StudyGuidanceGroupTag.upsert(
    {
      studyGuidanceGroupId: groupId,
      ...tagToUpdate,
    },
    {
      where: {
        studyGuidanceGroupId: groupId,
      },
    }
  )
  return result
}

const checkStudyGuidanceGroupsAccess = async hyPersonSisuId => (await getGroupsFromImporter(hyPersonSisuId)).length > 0

module.exports = {
  getAllStudentsUserHasInGroups,
  getAllGroupsAndStudents,
  changeGroupTags,
  checkStudyGuidanceGroupsAccess,
}
