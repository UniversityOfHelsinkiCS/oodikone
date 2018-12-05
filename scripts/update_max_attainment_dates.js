const logger = require('../src/util/logger')
const { updateMaxAttainmentDates } = require('../src/services/doo_api_database_updater/update_max_attainment_dates')

const run = async () => {
  try {
    logger.info('starting')

    await updateMaxAttainmentDates()

    logger.info('complete')
    process.exit(0)
  } catch (err) {
    logger.error('Update failed', err)
    process.exit(1)
  }
}

run()
