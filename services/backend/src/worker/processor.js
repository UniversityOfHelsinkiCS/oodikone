const {
  refreshLanguageCenterData,
  refreshFaculties,
  refreshNewOverviews,
  refreshTrends,
  refreshStatistics,
} = require('../events')

// This bullmq worker processor has to be in a different file for it to be run in a separate process.

const refreshers = {
  languagecenter: refreshLanguageCenterData,
  faculties: refreshFaculties,
  overviews: refreshNewOverviews,
  trends: refreshTrends,
  statistics: refreshStatistics,
}

module.exports = async job => {
  await refreshers[job.id]()
}
