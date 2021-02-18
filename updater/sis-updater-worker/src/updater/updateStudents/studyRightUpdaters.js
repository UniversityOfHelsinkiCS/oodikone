const { sortBy, sortedUniqBy } = require('lodash')
const {
  ElementDetail,
} = require('../../db/models')
const { selectFromByIds, bulkCreate }  = require('../../db')
const { getDegrees } = require('../shared')

const createDegreeFromGroupId = groupdId => {
  // Create degree object to be added to db as element detail
  const degrees = getDegrees(groupdId)
  if (!degrees) return
  const degree = degrees[0]
  return {
    group_id: `${groupdId}-degree`,
    code: degree.short_name.en,
    name: degree.name
  }
}

const updateElementDetails = async studyRights => {
  // Parse possible values for degrees, programmes and studytracks based on phases the student has been accepted to.
  // If elements aren't updated, db doesn't have right elementdetail codes and adding studyrightelements to db fails.
  const groupedEducationPhases = studyRights.reduce(
    (acc, curr) => {
      const {
        accepted_selection_path: {
          educationPhase1GroupId,
          educationPhase1ChildGroupId,
          educationPhase2GroupId,
          educationPhase2ChildGroupId
        }
      } = curr
      // Degree fetching is done only if educationPhase is present. Not the best logic, should be fixed.
      if (educationPhase1GroupId) {
        acc[10].add(createDegreeFromGroupId(educationPhase1GroupId))
      }
      if (educationPhase2GroupId) {
        acc[10].add(createDegreeFromGroupId(educationPhase2GroupId))
      }
      acc[20].add(educationPhase1GroupId)
      acc[20].add(educationPhase2GroupId)
      acc[30].add(educationPhase1ChildGroupId)
      acc[30].add(educationPhase2ChildGroupId)
      return acc
    },
    { 10: new Set(), 20: new Set(), 30: new Set() }
  )

  const programmes = await selectFromByIds(
    'modules',
    [...groupedEducationPhases[20]].filter(a => !!a),
    'group_id'
  )
  const studytracks = await selectFromByIds(
    'modules',
    [...groupedEducationPhases[30]].filter(a => !!a),
    'group_id'
  )

  const mappedDegrees = [...groupedEducationPhases[10]].filter(degree => degree).map(degree => ({...degree, type: 10}))
  const mappedProgrammes = programmes.map(programme => ({ ...programme, type: 20 }))
  const mappedStudytracks = studytracks.map(studytrack => ({ ...studytrack, type: 30 }))

  // Sort to avoid deadlocks
  await bulkCreate(
    ElementDetail,
    sortedUniqBy(sortBy([...mappedDegrees, ...mappedProgrammes, ...mappedStudytracks], ['code']), e => e.code),
    null,
    ['code']
  )

  return [...mappedDegrees, ...mappedProgrammes, ...mappedStudytracks].reduce((acc, curr) => {
    acc[curr.group_id] = curr.code
    return acc
  }, {})
}

module.exports = {
  updateElementDetails
}