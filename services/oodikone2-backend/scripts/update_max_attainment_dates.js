const logger = require('../src/util/logger')
const { updateAttainmentDates } = require('../src/services/doo_api_database_updater/update_attainment_dates')

const run = async () => {
  try {
    logger.info('starting')

    await updateAttainmentDates()

    logger.info('complete')
    process.exit(0)
  } catch (err) {
    logger.error('Update failed', err)
    process.exit(1)
  }
}

run()
