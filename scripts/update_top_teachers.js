const { findAndSaveTopTeachers } = require('../src/services/topteachers')
const logger = require('../src/util/logger')

const findAndSaveTeachers = async (startcode, endcode) => {
  for (let code = startcode; code <= endcode; code++) {
    logger.info(`Saving top teachers from year ${code}`)
    await findAndSaveTopTeachers(code)
  }
}

const parseargs = (args, SEPARATOR='=')=> args
  .filter(arg => arg.includes(SEPARATOR))
  .reduce((acc, arg) => {
    const [ key, val ] = arg.split(SEPARATOR)
    return { 
      ...acc, 
      [key.trim()]: val.trim()
    }
  }, {})

const run = async () => {
  try {
    const { from, to } = parseargs(process.argv)
    const start = from
    const end = to || from
    if (end < start) {
      throw Error('"to" -argument has to be less than "from" -argument. ')
    }
    await findAndSaveTeachers(start, end)
    process.exit(0)
  } catch (error) {
    logger.error(`Failed to update top teachers: ${error.message}`)
    process.exit(1)
  }
}

run()