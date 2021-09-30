const { getImporterClient } = require('../util/importerClient')
const importerClient = getImporterClient()

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
  return Object.values(data)
}

module.exports = {
  getAllStudentsUserHasInGroups,
  getAllGroupsAndStudents,
}
