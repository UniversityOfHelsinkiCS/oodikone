const logger = require('../../util/logger')
const {
  getOpenUniSearchesByUser,
  createOpenUniPopulationSearch,
  updateOpenUniPopulationSearch,
  deleteOpenUniSearch,
} = require('./openUniSearches')

const getOpenUniSearches = async userId => {
  const savedSearches = await getOpenUniSearchesByUser(userId)
  if (savedSearches === undefined) return []
  const foundSearches = savedSearches.reduce(
    (res, search) => [
      ...res,
      {
        id: search.id,
        userId: search.userId,
        name: search.name,
        courseList: search.courseCodes,
        updatedAt: search.updatedAt,
      },
    ],
    []
  )
  return foundSearches
}

const createNewSearch = async (userId, name, courseCodes) => {
  const savedSearches = await getOpenUniSearchesByUser(userId)
  if (savedSearches !== undefined) {
    const searchNames = savedSearches.map(search => search.name)
    if (searchNames.includes(name)) return null
  }
  try {
    const created = await createOpenUniPopulationSearch(userId, name, courseCodes)
    if (!created) return null
    return created
  } catch (e) {
    logger.error(`Couldn't create new open uni search instance: ${e}`)
    return null
  }
}

const deleteSearch = async (userId, id) => {
  try {
    const deleted = await deleteOpenUniSearch(userId, id)
    if (!deleted) return null
    return deleted
  } catch (e) {
    logger.error(`Couldn't delete open uni search instance: ${e}`)
    return null
  }
}

const updateSearch = async (userId, id, courseCodes) => {
  try {
    const updated = await updateOpenUniPopulationSearch(userId, id, courseCodes)
    if (!updated) return null
    return updated
  } catch (e) {
    logger.error(`Couldn't update open uni search instance: ${e}`)
  }
}

module.exports = { getOpenUniSearches, createNewSearch, deleteSearch, updateSearch }
