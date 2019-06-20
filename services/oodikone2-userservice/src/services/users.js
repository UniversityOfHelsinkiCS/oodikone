const Sequelize = require('sequelize')
const jwt = require('jsonwebtoken')
const moment = require('moment')
const { flatMap } = require('lodash')
const { User, ElementDetails, AccessGroup, HyGroup, Affiliation, FacultyProgrammes, UserFaculties, sequelize } = require('../models')
const ElementService = require('./studyelements')
const AccessService = require('./accessgroups')
const AffiliationService = require('./affiliations')
const HyGroupService = require('./hygroups')
const { requiredGroup } = require('../conf')
const Op = Sequelize.Op

const TOKEN_VERSION = 1 // When token structure changes, increment in userservice, backend and frontend
const generateToken = async (uid, mockedBy = null) => {
  const user = await byUsername(uid)
  const userData = getUserData(user)
  const elements = userData.elementdetails.map(element => element.code)
  const payload = {
    id: user.id,
    userId: uid, // username
    name: user.full_name,
    enabled: userData.is_enabled,
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
  const savedGroups = await service.findAll()
  group.forEach(async code => {
    if (!savedGroups.map(sg => sg.code).includes(code)) {
      console.log(`Creating grp ${code}`)
      await service.create(code)
    }
  })
}

const updateGroups = async (user, affiliations, hyGroups) => {
  let affiliationsToBeUpdated = (await user.getAffiliation()).map(af => af.code)
  let affiliationsToAdd = []
  let affiliationsToDelete = []

  affiliations.forEach(async (affilitation) => {
    if (!affiliationsToBeUpdated.includes(affilitation)) {
      affiliationsToAdd = affiliationsToAdd.concat(affilitation)
    }
  })
  affiliationsToBeUpdated.forEach(async affilitation => {
    if (!affiliations.includes(affilitation)) {
      affiliationsToDelete  = affiliationsToDelete.concat(affilitation)
    }
  })
  await user.addAffiliation(await AffiliationService.byCodes(affiliationsToAdd))
  await user.removeAffiliation(await AffiliationService.byCodes(affiliationsToDelete))

  let hyGroupsToBeUpdated = (await user.getHy_group()).map(hg => hg.code)
  let hyGroupsToAdd = []
  let hyGroupsToDelete = []

  hyGroups.forEach(async (hyGroup) => {
    if (!hyGroupsToBeUpdated.includes(hyGroup)) {
      hyGroupsToAdd = hyGroupsToAdd.concat(hyGroup)
    }
  })
  hyGroupsToBeUpdated.forEach(async hyGroup => {
    if (!hyGroups.includes(hyGroup)) {
      hyGroupsToDelete = hyGroupsToDelete.concat(hyGroup)
    }
  })
  await user.addHy_group(await HyGroupService.byCodes(hyGroupsToAdd))
  await user.removeHy_group(await HyGroupService.byCodes(hyGroupsToDelete))
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
    await user.addHy_group(userHyGroups)

    const userAffiliations = await AffiliationService.byCodes(affiliations)
    await user.addAffiliation(userAffiliations)

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
  if (user && user.accessgroup.map(r => r.group_code).includes('admin')) {
    const token = await generateToken(asUser, uid)
    return token
  }
  return undefined
}

const userIncludes = [
  {
      model: ElementDetails,
      as: 'programme'
  },
  {
      model: AccessGroup,
      as: 'accessgroup',
      attributes: ['id', 'group_code', 'group_info']
  },
  {
      model: HyGroup,
      as: 'hy_group'
  },
  {
    model: UserFaculties,
    as: 'faculty',
    include: {
      model: FacultyProgrammes,
      as: 'programme',
      include: {
        model: ElementDetails,
      }
    }
  },
  {
      model: Affiliation,
      as: 'affiliation'
  }
]

const getUserData = user => {
  if (user == null) return null
  const newuser = user.get()
  newuser.elementdetails = getUserElementDetails(newuser)
  newuser.is_enabled = requiredGroup === null || newuser.hy_group.some(e => e.code === requiredGroup)
  newuser.hy_group = null
  return newuser
}

const byUsername = async (username) => {
  const user = await User.findOne({
    where: {
      username: {
        [Op.eq]: username
      }
    },
    include: userIncludes
  })
  return user
}

const createUser = async (username, fullname, email) => {
  return User.create({
    username: username,
    full_name: fullname,
    email
  })
}

const updateUser = async (userObject, values) => {
  return userObject.update(values)
}


const byId = async (id) => {
  const user = await User.findOne({
    where: {
      id: {
        [Op.eq]: id
      }
    },
    include: userIncludes
  })
  return user
}

const getUnitsFromElementDetails = async username => {
  const user = await byUsername(username)
  const userData = getUserData(user)
  return userData.elementdetails.map(element => UnitService.parseUnitFromElement(element))
}

const getUserElementDetails = user => {
  const elementdetails = [...user.programme, ...flatMap(user.faculty, f => f.programme.map(p => p.element_detail))]
  return elementdetails
}
const getUserAccessGroups = async username => {
  const user = await byUsername(username)
  return await user.getAccessgroup()
}

const findAll = async () => {
  const users = await User.findAll({
    include: userIncludes,
  })
  return users
}

const enableElementDetails = async (uid, codes) => {
  const user = await byId(uid)
  const elements = await ElementService.byCodes(codes)
  await user.addProgramme(elements)
}

const removeElementDetails = async (uid, codes) => {
  const user = await byId(uid)
  const elements = await ElementService.byCodes(codes)
  await user.removeProgramme(elements)
}

const setFaculties = async (uid, faculties) => {
  await sequelize.transaction(async transaction => {
    await UserFaculties.destroy({ where: { userId: uid }, transaction })
    for (const faculty of faculties) {
      await UserFaculties.create({ userId: uid, faculty_code: faculty }, { transaction })
    }
  })
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
  getRoles,
  getUserData,
  setFaculties
}