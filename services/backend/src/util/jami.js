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

const getUserIamAccess = async (sisPersonId, iamGroups, attempt = 1) => {
  if (iamGroups.length === 0) return {}

  try {
    const { data: iamAccess } = await jamiClient.post('/', {
      userId: sisPersonId,
      iamGroups,
      getSisuAccess: true,
    })

    const { specialGroup } = iamAccess
    delete iamAccess.specialGroup

    return { iamAccess, specialGroup }
  } catch (error) {
    if (attempt > 3) {
      logger.error('[Jami] error: ', error)
      Sentry.captureException(error)

      return {}
    }

    return getUserIamAccess(sisPersonId, iamGroups, attempt + 1)
  }
}

const getUserIams = async userId => {
  try {
    const { data } = await jamiClient.get(`/${userId}`)

    return data.iamGroups
  } catch (error) {
    if (error.response.status !== 404) {
      logger.error('[Jami] error: ', error)
      Sentry.captureException(error)
    }

    return []
  }
}

const getAllUserAccess = async userIds => {
  const { data } = await jamiClient.post('access-and-special-groups', { userIds })

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
  getUserIams,
  getAllUserAccess,
}
