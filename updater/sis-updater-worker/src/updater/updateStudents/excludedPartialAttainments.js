const { readFileSync } = require('fs')

const { logger } = require('../../utils/logger')

const getAttainmentsToBeExcluded = () => {
  try {
    const data = readFileSync(`${__dirname}/excludedPartialAttainments.csv`).toString()
    if (!data) return new Set()
    const attainmentIds = data.split('\n')
    return new Set(attainmentIds)
  } catch (error) {
    logger.error({ message: 'Reading excluded attainments from csv failed', meta: error.stack })
  }
}

module.exports = { getAttainmentsToBeExcluded }
