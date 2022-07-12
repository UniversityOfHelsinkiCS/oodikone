/* eslint-disable no-unused-vars */
const _ = require('lodash')
const Organization = require('../models/organization')
const { getIAMRights } = require('./IAMRights')

const isNumber = value => !Number.isNaN(parseInt(value, 10))

const normalizeOrganizationCode = r => {
  if (!r.includes('_')) {
    return r
  }

  const [left, right] = r.split('_')
  const prefix = [...left].filter(isNumber).join('')
  const suffix = `${left[0]}${right}`
  const providercode = `${prefix}0-${suffix}`
  return providercode
}

const RELEVANT_ORGANIZATION_CODES = [
  'H906', // Kielikeskus
  'H930', // Avoin yliopisto
]

const ORGANIZATION_ACCESS_BY_IAM_GROUP = {
  'grp-kielikeskus-esihenkilot': {
    // Kielikeskus
    H906: {
      read: true,
      write: true,
      admin: true,
    },
  },
  'grp-avoin-johto': {
    // Avoin yliopisto
    H930: {
      read: true,
    },
  },
}

const getOrganizationAccessFromIamGroups = user => {
  const access = {}

  const iamAccess = (user.iamGroups ?? []).reduce(
    (access, group) => _.merge(access, ORGANIZATION_ACCESS_BY_IAM_GROUP[group] ?? {}),
    {}
  )

  Object.keys(iamAccess).forEach(code => {
    access[code] = iamAccess[code]
  })

  return access
}

const organizationIsRelevant = organization => {
  const { code } = organization

  return code.includes('-') || RELEVANT_ORGANIZATION_CODES.includes(code)
}

const getAccessToAll = async accessLevel => {
  const access = {}
  const allOrganizations = await Organization.findAll({ attributes: ['code'] })
  allOrganizations.filter(organizationIsRelevant).forEach(({ code }) => {
    access[code] = accessLevel
  })
  return access
}

const getLomakeAccess = async user => {
  const access = {}
  const { access: iamAccess } = getIAMRights(user.iamGroups)

  if (!_.isObject(iamAccess)) return access
  Object.keys(iamAccess).forEach(code => {
    access[code] = iamAccess[code]
  })
  return access
}

const getOrganizationAccess = async user => {
  const access = {
    ...(await getLomakeAccess(user)),
    ...getOrganizationAccessFromIamGroups(user),
  }

  return access
}

module.exports = {
  getOrganizationAccess,
}
