const { getImporterClient } = require('../util/importerClient')
const importerClient = getImporterClient()
const { StudyGuidanceGroupTag } = require('../models/models_kone')

const getAllStudentsUserHasInGroups = async sisPersonId => {
  if (!importerClient) {
    return new Set()
  }
  const { data } = await importerClient.get(`/person-groups/person/${sisPersonId}`)
  return new Set(
    Object.values(data)
      .map(group => group.members)
      .flat()
      .map(member => member.personStudentNumber)
  )
}

const getAllGroupsAndStudents = async sisPersonId => {
  if (!importerClient) {
    return []
  }
  const { data } = await importerClient.get(`/person-groups/person/${sisPersonId}`)
  const tagsByGroupId = (await StudyGuidanceGroupTag.findAll()).reduce((acc, curr) => {
    return { ...acc, [curr.studyGuidanceGroupId]: curr }
  }, {})
  return Object.values(data).map(group => ({ ...group, tags: tagsByGroupId[group.id] }))
}

const changeGroupTags = async ({ groupId, tags }) => {
  const { studyProgramme, year } = tags
  const tagToUpdate = studyProgramme ? { studyProgramme } : { year }

  await StudyGuidanceGroupTag.upsert(
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
}

module.exports = {
  getAllStudentsUserHasInGroups,
  getAllGroupsAndStudents,
  changeGroupTags,
}
