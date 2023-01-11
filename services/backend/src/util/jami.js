const axios = require('axios')
const Sentry = require('@sentry/node')

const { importerToken, jamiUrl } = require('../conf-backend')
const logger = require('./logger')

const jamiClient = axios.create({
  baseURL: jamiUrl,
  params: {
    token: importerToken,
  },
})

const getUserIamAccess = async (user, attempt = 1) => {
  if (user.iamGroups.length === 0) return {}

  const { id, iamGroups } = user

  try {
    const { data: iamAccess } = await jamiClient.post('/', {
      userId: id,
      iamGroups,
    })

    return iamAccess
  } catch (error) {
    if (attempt > 3) {
      logger.error('[Jami] error: ', error)
      Sentry.captureException(error)

      return {}
    }

    return getUserIamAccess(user, attempt + 1)
  }
}

const getAllUserAccess = async () => {
  const { data } = await jamiClient.get('/all-access')

  return data
}

const testJami = async () => {
  try {
    await jamiClient.get('/ping', { timeout: 4000 })
    logger.info('JAMI connected')
  } catch (error) {
    logger.error(error)
    logger.warn('JAMI not responding :(')
    logger.info('Are you sure you are using the latest JAMI image?')
  }
}

testJami()

module.exports = {
  getUserIamAccess,
  getAllUserAccess,
}
