const {
  refreshLanguageCenterData,
  refreshFaculties,
  refreshNewOverviews,
  refreshTrends,
  refreshStatistics,
  updateFaculty,
} = require('../events')
const logger = require('../util/logger')

// This bullmq worker processor has to be in a different file for it to be run in a separate process.

const refreshers = {
  languagecenter: refreshLanguageCenterData,
  faculties: updateFaculty,
  overviews: refreshNewOverviews,
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
