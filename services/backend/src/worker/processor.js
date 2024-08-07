const {
  refreshLanguageCenterData,
  refreshProgramme,
  refreshStatistics,
  refreshFaculty,
  refreshCloseToGraduating,
} = require('../events')
const { updateSISStudyPlans } = require('../services/sisUpdaterService')
const logger = require('../util/logger')

// This bullmq worker processor has to be in a different file for it to be run in a sandboxed process.
// Beware of creating a circular dependency, e.g. don't import worker file into the files that you import to this file.
// This causes this process to disregard concurrency-setting leading to trouble

// Also, don't delete even though some tools may recognize this as unused file. it is used runtime

const refreshers = {
  languagecenter: refreshLanguageCenterData,
  faculty: refreshFaculty,
  programme: refreshProgramme,
  statistics: refreshStatistics,
  closeToGraduation: refreshCloseToGraduating,
}

module.exports = async job => {
  try {
    if (job.name === 'studyplansUpdate') {
      await updateSISStudyPlans(job.data.days)
      return
    }
    await refreshers[job.id.split('-')[0]](job.data?.code)
  } catch (error) {
    logger.error(error.stack)
    throw error
  }
}
