const { updateTopTeachers } = require('../src/services/teachers')
const logger = require('../src/util/logger')

const run = async () => {
  try {
    logger.info('Started updating top teachers.')
    await updateTopTeachers()
    logger.info('Finished updating top teachers.')
    process.exit(0)
  } catch (error) {
    logger.error(`Failed to update top teachers: ${error.message}`)
    process.exit(1)
  }
}

run()