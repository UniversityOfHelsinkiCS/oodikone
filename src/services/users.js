const Sequelize = require('sequelize')
const jwt = require('jsonwebtoken')
const moment = require('moment')
const { User, ElementDetails, AccessGroup } = require('../models')
const ElementService = require('./studyelements')
const AccessService = require('./accessgroups')
const Op = Sequelize.Op

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
  }
  const token = jwt.sign(payload, process.env.TOKEN_SECRET)

  // return the information including token as JSON
  return token
}

const login = async (uid, full_name, mail) => {
  let user = await byUsername(uid)
  let isNew = false
  if (!user) {
    console.log('New user')
    user = await createUser(uid, full_name, mail)
    isNew = true
  } else {
    user = await updateUser(user, { full_name })
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