import logger from '../../util/logger'
import {
  getOpenUniSearchesByUser,
  createOpenUniPopulationSearch,
  updateOpenUniPopulationSearch,
  deleteOpenUniSearch,
} from './openUniSearches'

type FoundSearch = {
  id: string
  userId: string
  name: string
  courseList: string[]
  updatedAt: Date
}

export const getOpenUniSearches = async (userId: string) => {
  const savedSearches = await getOpenUniSearchesByUser(userId)
  if (savedSearches === undefined) {
    return []
  }

  const foundSearches = savedSearches.reduce((acc, search) => {
    acc.push({
      id: search.id,
      userId: search.userId,
      name: search.name,
      courseList: search.courseCodes,
      updatedAt: search.updatedAt,
    })
    return acc
  }, [] as FoundSearch[])

  return foundSearches
}

export const createNewSearch = async (userId: string, name: string, courseCodes: string[]) => {
  const savedSearches = await getOpenUniSearchesByUser(userId)
  if (savedSearches && savedSearches.some(search => search.name === name)) {
    return null
  }
  try {
    const created = await createOpenUniPopulationSearch(userId, name, courseCodes)
    if (!created) {
      return null
    }
    return created
  } catch (error) {
    logger.error(`Couldn't create new open uni search instance: ${error}`)
    return null
  }
}

export const deleteSearch = async (userId: string, id: string) => {
  try {
    const deleted = await deleteOpenUniSearch(userId, id)
    if (!deleted) {
      return null
    }
    return deleted
  } catch (error) {
    logger.error(`Couldn't delete open uni search instance: ${error}`)
    return null
  }
}

export const updateSearch = async (userId: string, id: string, courseCodes: string[]) => {
  try {
    const updated = await updateOpenUniPopulationSearch(userId, id, courseCodes)
    if (!updated) {
      return null
    }
    return updated
  } catch (error) {
    logger.error(`Couldn't update open uni search instance: ${error}`)
  }
}
