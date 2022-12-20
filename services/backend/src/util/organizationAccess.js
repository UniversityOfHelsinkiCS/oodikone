/* eslint-disable no-unused-vars */
const _ = require('lodash')
const Sentry = require('@sentry/node')

const { runningInCI } = require('../conf-backend')
const logger = require('./logger')
const { getJamiClient } = require('../util/jamiClient')
const jamiClient = getJamiClient()

const getIAMAccessFromJami = async (user, attempt = 1) => {
  const { userId, iamGroups } = user

  try {
    const { data: iamAccess } = await jamiClient.post('/', {
      userId,
      iamGroups,
    })

    return iamAccess
  } catch (error) {
    if (attempt > 3) {
      logger.error(error)
      Sentry.captureException(error)

      return {}
    }

    return getIAMAccessFromJami(user, attempt + 1)
  }
}

const getAccessFromIAMs = async user => {
  if (runningInCI || user.iamGroups.length === 0) return {}

  const access = {}

  const iamAccess = await getIAMAccessFromJami(user)

  if (!_.isObject(iamAccess)) return access
  Object.keys(iamAccess).forEach(code => {
    access[code] = iamAccess[code]
  })

  return access
}

const getOrganizationAccess = async user => {
  if (!user.iamGroups) user.iamGroups = user.iam_groups

  const access = await getAccessFromIAMs(user)

  return access
}

module.exports = {
  getOrganizationAccess,
}
