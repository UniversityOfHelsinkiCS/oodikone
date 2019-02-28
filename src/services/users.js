const Sequelize = require('sequelize')
const jwt = require('jsonwebtoken')
const moment = require('moment')
const { User, ElementDetails, AccessGroup } = require('../models')
const ElementService = require('./studyelements')
const AccessService = require('./accessgroups')
const AffiliationService = require('./affiliations')
const HyGroupService = require('./hygroups')
const Op = Sequelize.Op

const TOKEN_VERSION = 1 // When token structure changes, increment in userservice, backend and frontend
const generateToken = async (uid, mockedBy = null) => {
  let user = await byUsername(uid)
  const elementdetails = await getUserElementDetails(user.username)
  const elements = elementdetails.map(element => element.code)
  const payload = {
    id: user.id,
    userId: uid, // username
    name: user.full_name,
    enabled: user.is_enabled,
    language: user.language,
    mockedBy,
    rights: elements,
    roles: user.accessgroup,
    createdAt: moment().toISOString(),
    version: TOKEN_VERSION,
  }
  const token = jwt.sign(payload, process.env.TOKEN_SECRET)

  // return the information including token as JSON
  return token
}
const createMissingGroups = async (group, service) => {
  const savedGroups = service.findAll()
  group.forEach(code => {
    if (!savedGroups.contains(code)) {
      await service.create(code)
    }
  })
}

const updateGroups = async (user, affiliations, hyGroups) => {
  affiliationsToBeUpdated = user.getAffiliations()
    affiliations.forEach(async (affilitation) => {
      if (!affiliationsToBeUpdated.contains(affilitation)) {
        await user.addAffiliation(affilitation)
      }
    })
    affiliationsToBeUpdated.forEach(async affilitation => {
      if (!affiliations.contains(affilitation)) {
        await user.deleteAffilitation(affilitation)
      }
    })

    hyGroupsToBeUpdated = user.getAffiliations()
    hyGroups.forEach(async (hyGroup) => {
      if (!hyGroupsToBeUpdated.contains(hyGroup)) {
        await user.addAffiliation(hyGroup)
      }
    })
    hyGroupsToBeUpdated.forEach(async hyGroup => {
      if (!hyGroups.contains(hyGroup)) {
        await user.deleteAffilitation(hyGroup)
      }
    })
}

const login = async (uid, full_name, hyGroups, affiliations, mail) => {
  let user = await byUsername(uid)
  let isNew = false

  await createMissingGroups(hyGroups, HyGroupService)
  await createMissingGroups(affiliations, AffiliationService)
  
  if (!user) {
    console.log('New user')
    user = await createUser(uid, full_name, mail)

    const userHyGroups = await HyGroupService.byCodes(hyGroups)
    await user.addHygroups(userHyGroups)

    const userAffiliations = await AffiliationService.byCodes(affiliations)
    await user.addAffiliations(userAffiliations)

    isNew = true
  } else {
    user = await updateUser(user, { full_name, mail })
    await updateGroups(user, affiliations, hyGroups)
  }

  console.log('Generating token')
  const token = await generateToken(uid)
  console.log('Token done')
  return ({ token, isNew })

}
const superlogin = async (uid, asUser) => {
  const user = await byUsername(uid)
  console.log(user)
  if (user.accessgroup.map(r => r.group_code).includes('admin')) {
    const token = await generateToken(asUser, uid)
    return token
  }
  return undefined
}
const byUsername = async (username) => {
  return User.findOne({
    where: {
      username: {
        [Op.eq]: username
      }
    },
    include: [{
      model: ElementDetails,
      as: 'elementdetails'
    }, {
      model: AccessGroup,
      as: 'accessgroup',
      attributes: ['id', 'group_code', 'group_info']
    }]
  })
}

const createUser = async (username, fullname, email) => {
  return User.create({
    username: username,
    full_name: fullname,
    is_enabled: false,
    czar: false,
    email
  })
}

const updateUser = async (userObject, values) => {
  return userObject.update(values)
}


const byId = async (id) => {
  return User.findOne({
    where: {
      id: {
        [Op.eq]: id
      }
    },
    include: [{
      model: ElementDetails,
      as: 'elementdetails'
    }, {
      model: AccessGroup,
      as: 'accessgroup',
      attributes: ['id', 'group_code', 'group_info']
    }]
  })
}

const getUnitsFromElementDetails = async username => {
  const user = await byUsername(username)
  const elementDetails = await user.getElementdetails()
  return elementDetails.map(element => UnitService.parseUnitFromElement(element))
}

const getUserElementDetails = async username => {
  const user = await byUsername(username)
  return await user.getElementdetails()
}
const getUserAccessGroups = async username => {
  const user = await byUsername(username)
  return await user.getAccessgroup()
}

const findAll = async () => {
  return User.findAll({
    include: [{
      model: ElementDetails,
      as: 'elementdetails'
    },
    {
      model: AccessGroup,
      as: 'accessgroup'
    }]
  })
}

const enableElementDetails = async (uid, codes) => {
  const user = await byId(uid)
  const elements = await ElementService.byCodes(codes)
  await user.addElementdetails(elements)
}

const removeElementDetails = async (uid, codes) => {
  const user = await byId(uid)
  const elements = await ElementService.byCodes(codes)
  await user.removeElementdetails(elements)
}

const modifyRights = async (uid, rights) => {
  console.log(uid, rights)
  const rightsToAdd = Object.entries(rights).map(([code, val]) => {
    if (val === true) {
      return code
    }
  }).filter(code => code)
  const rightsToRemove = Object.entries(rights).map(([code, val]) => {
    if (val === false) {
      return code
    }
  }).filter(code => code)

  const user = await byId(uid)
  const accessGroupsToAdd = await AccessService.byCodes(rightsToAdd)
  const accessGroupsToRemove = await AccessService.byCodes(rightsToRemove)

  await user.addAccessgroup(accessGroupsToAdd)
  await user.removeAccessgroup(accessGroupsToRemove)
}
const getRoles = async (user) => {
  const foundUser = byUsername(user)
  return foundUser.accessgroup
}



module.exports = {
  byUsername,
  createUser,
  updateUser,
  findAll,
  byId,
  getUnitsFromElementDetails,
  getUserElementDetails,
  enableElementDetails,
  removeElementDetails,
  login,
  superlogin,
  modifyRights,
  getUserAccessGroups,
  getRoles

}