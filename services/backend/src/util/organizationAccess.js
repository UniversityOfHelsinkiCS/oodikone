/* eslint-disable no-unused-vars */
const _ = require('lodash')

const { getUserIamAccess } = require('./jami')

const getAccessFromIAMs = async user => {
  if (user.iamGroups.length === 0) return {}

  const { iamAccess, specialGroup } = await getUserIamAccess(user)

  const access = {}
  if (_.isObject(iamAccess)) {
    Object.keys(iamAccess).forEach(code => {
      access[code] = iamAccess[code]
    })
  }

  return { access, specialGroup }
}

const getOrganizationAccess = async user => {
  if (!user.iamGroups) user.iamGroups = user.iam_groups

  const access = await getAccessFromIAMs(user)

  return access
}

module.exports = {
  getOrganizationAccess,
}
