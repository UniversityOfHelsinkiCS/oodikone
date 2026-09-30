import { readFileSync } from 'fs'
import logger from '../../utils/logger'

export const getAttainmentsToBeExcluded = () => {
  try {
    const data = readFileSync(`${__dirname}/excludedPartialAttainments.csv`).toString()
    if (!data) return new Set<string>()
    const attainmentIds = data.split('\n')
    return new Set(attainmentIds)
  } catch (error: any) {
    logger.error({ message: 'Reading excluded attainments from csv failed', meta: error.stack })
    throw error
  }
}
