import { readFileSync } from 'fs'
import logger from '../../utils/logger.js'

const __dir = import.meta.dirname

export const getAttainmentsToBeExcluded = () => {
  try {
    const data = readFileSync(`${__dir}/excludedPartialAttainments.csv`).toString()
    if (!data) return new Set()
    const attainmentIds = data.split('\n')
    return new Set(attainmentIds)
  } catch (error) {
    logger.error({ message: 'Reading excluded attainments from csv failed', meta: error.stack })
  }
}
