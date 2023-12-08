const {
  refreshLanguageCenterData,
  refreshProgramme,
  refreshTrends,
  refreshStatistics,
  refreshFaculty,
} = require('../events')
const logger = require('../util/logger')

// This bullmq worker processor has to be in a different file for it to be run in a sandboxed process.
// Beware of creating a circular dependency, e.g. don't import worker file into the files that you import to this file.
// This causes this process to disregard concurrency-setting leading to trouble

const refreshers = {
  languagecenter: refreshLanguageCenterData,
  faculty: refreshFaculty,
  programme: refreshProgramme,
  trends: refreshTrends,
  statistics: refreshStatistics,
}

module.exports = async job => {
  try {
    await refreshers[job.id.split('-')[0]](job.data?.code)
  } catch (e) {
    logger.error(e.stack)
    throw e
  }
}
