const Sequelize = require('sequelize')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
const moment = require('moment')
const { User, UserElementDetails, AccessGroup, HyGroup, Affiliation, UserFaculties, sequelize } = require('../models')
const AccessService = require('./accessgroups')
const AffiliationService = require('./affiliations')
const HyGroupService = require('./hygroups')
const { requiredGroup, courseStatisticsGroup, TOKEN_SECRET, hyOneGroup } = require('../conf')
const Op = Sequelize.Op

const TOKEN_VERSION = 1.1 // When token structure changes, increment in userservice, backend and frontend
const generateToken = async (uid, mockedBy = null) => {
  const user = await byUsername(uid)
  const userData = getUserData(user)
  const programmes = userData.elementdetails
  const payload = {
    id: user.id,
    userId: uid, // username
    name: user.full_name,
    enabled: userData.is_enabled,
    language: user.language,
    mockedBy,
    rights: programmes,
    roles: user.accessgroup,
    createdAt: moment().toISOString(),
    version: TOKEN_VERSION,
    sisPersonId: user.sisu_person_id,
  }
  const token = jwt.sign(payload, TOKEN_SECRET)

  // return the information including token as JSON
  return token
}
const createMissingGroups = async (group, service) => {
  const savedGroups = await service.findAll()
  group.forEach(async code => {
    if (!savedGroups.map(sg => sg.code).includes(code)) {
      await service.create(code)
    }
  })
}

const updateGroups = async (user, affiliations, hyGroups) => {
  let affiliationsToBeUpdated = (await user.getAffiliation()).map(af => af.code)
  let affiliationsToAdd = []
  let affiliationsToDelete = []

  affiliations.forEach(async affilitation => {
    if (!affiliationsToBeUpdated.includes(affilitation)) {
      affiliationsToAdd = affiliationsToAdd.concat(affilitation)
    }
  })
  affiliationsToBeUpdated.forEach(async affilitation => {
    if (!affiliations.includes(affilitation)) {
      affiliationsToDelete = affiliationsToDelete.concat(affilitation)
    }
  })
  await user.addAffiliation(await AffiliationService.byCodes(affiliationsToAdd))
  await user.removeAffiliation(await AffiliationService.byCodes(affiliationsToDelete))

  let hyGroupsToBeUpdated = (await user.getHy_group()).map(hg => hg.code)
  let hyGroupsToAdd = []
  let hyGroupsToDelete = []

  hyGroups.forEach(async hyGroup => {
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

const login = async (uid, full_name, hyGroups, affiliations, mail, hyPersonSisuId, hasStudyGuidanceGroupAccess) => {
  let user = await byUsername(uid)
  let isNew = false
  const lastLogin = new Date()
  await createMissingGroups(hyGroups, HyGroupService)
  await createMissingGroups(affiliations, AffiliationService)

  if (!user) {
    user = await createUser(uid, full_name, mail, hyPersonSisuId, lastLogin)

    const userHyGroups = await HyGroupService.byCodes(hyGroups)
    await user.addHy_group(userHyGroups)

    const userAffiliations = await AffiliationService.byCodes(affiliations)
    await user.addAffiliation(userAffiliations)

    isNew = true
  } else {
    user = await updateUser(user, { full_name, email: mail, sisu_person_id: hyPersonSisuId, last_login: lastLogin })
    await updateGroups(user, affiliations, hyGroups)
  }

  await determineAccessToCourseStats(user, hyGroups)
  await determineAccessToTeachersForOne(user, hyGroups)
  await determineAccessToStudyGuidanceGroups(user, hasStudyGuidanceGroupAccess)

  console.log('Generating token')
  const token = await generateToken(uid)
  console.log('Token done')
  return { token, isNew }
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
    separate: true,
    model: UserElementDetails,
    as: 'programme',
  },
  {
    model: AccessGroup,
    as: 'accessgroup',
    attributes: ['id', 'group_code', 'group_info'],
  },
  {
    required: false,
    model: HyGroup,
    as: 'hy_group',
    where: { code: requiredGroup },
  },
  {
    separate: true,
    model: UserFaculties,
    as: 'faculty',
  },
  {
    model: Affiliation,
    as: 'affiliation',
  },
]

const getUserData = user => {
  if (user == null) return null
  const newuser = user.get()
  newuser.elementdetails = getUserProgrammes(newuser)
  const hyGroups = newuser.hy_group.map(e => e.code)
  newuser.is_enabled = requiredGroup === null || _.intersection(hyGroups, requiredGroup).length > 0
  newuser.hy_group = null
  return newuser
}

const byUsernameMinified = async username => {
  const userMinified = await User.findOne({
    where: {
      username,
    },
    include: [
      {
        separate: true,
        model: UserElementDetails,
        as: 'programme',
        attributes: ['elementDetailCode'],
      },
      {
        model: AccessGroup,
        as: 'accessgroup',
        attributes: ['group_code'],
      },
      {
        separate: true,
        model: UserFaculties,
        as: 'faculty',
        attributes: ['faculty_code'],
      },
    ],
  })
  return userMinified
}

const byUsername = async username => {
  const user = await User.findOne({
    where: {
      username: {
        [Op.eq]: username,
      },
    },
    include: userIncludes,
  })
  return user
}

const createUser = async (username, fullname, email, hyPersonSisuId, lastLogin) => {
  return User.create({
    username: username,
    full_name: fullname,
    email,
    sisu_person_id: hyPersonSisuId,
    last_login: lastLogin,
  })
}

const updateUser = async (userObject, values) => {
  await User.upsert({ id: userObject.id, ...values })
  return userObject.update(values)
}

const byId = async id => {
  const user = await User.findOne({
    where: {
      id: {
        [Op.eq]: id,
      },
    },
    include: userIncludes,
  })
  return user
}

const getUserProgrammes = user => user.programme.map(p => p.elementDetailCode)

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

const addProgrammes = async (uid, codes) => {
  for (const code of codes) {
    await UserElementDetails.upsert({ userId: uid, elementDetailCode: code })
  }
}

const removeProgrammes = async (uid, codes) => {
  for (const code of codes) {
    await UserElementDetails.destroy({
      where: { userId: uid, elementDetailCode: code },
    })
  }
}

const setFaculties = async (uid, faculties) => {
  await sequelize.transaction(async transaction => {
    await UserFaculties.destroy({ where: { userId: uid }, transaction })
    for (const faculty of faculties) {
      await UserFaculties.create({ userId: uid, faculty_code: faculty }, { transaction })
    }
  })
}

const modifyRights = async (username, rights) => {
  const rightsToAdd = Object.entries(rights)
    .map(([code, val]) => {
      if (val === true) {
        return code
      }
    })
    .filter(code => code)
  const rightsToRemove = Object.entries(rights)
    .map(([code, val]) => {
      if (val === false) {
        return code
      }
    })
    .filter(code => code)

  const user = await byUsername(username)
  const accessGroupsToAdd = await AccessService.byCodes(rightsToAdd)
  const accessGroupsToRemove = await AccessService.byCodes(rightsToRemove)

  await user.addAccessgroup(accessGroupsToAdd)
  await user.removeAccessgroup(accessGroupsToRemove)
}
const getRoles = async user => {
  const foundUser = byUsername(user)
  return foundUser.accessgroup
}

const determineAccessToCourseStats = async (user, hyGroups) => {
  const accessGroups = (user && user.accessgroup) || []
  const alreadyAccess = accessGroups.some(({ group_code }) => group_code === 'courseStatistics')
  if (hyGroups.includes(courseStatisticsGroup) && !alreadyAccess) {
    await modifyRights(user.username, { courseStatistics: true })
  } else if (!hyGroups.includes(courseStatisticsGroup) && alreadyAccess) {
    await modifyRights(user.username, { courseStatistics: false })
  }
}

const determineAccessToTeachersForOne = async (user, hyGroups) => {
  const accessGroups = (user && user.accessgroup) || []
  const alreadyAccess = accessGroups.some(({ group_code }) => group_code === 'teachers')
  if (hyGroups.includes(hyOneGroup) && !alreadyAccess) {
    await modifyRights(user.username, { teachers: true })
  }
}

const determineAccessToStudyGuidanceGroups = async (user, hasStudyGuidanceGroupAccess) => {
  const accessGroups = (user && user.accessgroup) || []
  const alreadyAccess = accessGroups.some(({ group_code }) => group_code === 'studyGuidanceGroups')
  if (hasStudyGuidanceGroupAccess && !alreadyAccess) {
    await modifyRights(user.username, { studyGuidanceGroups: true })
  } else if (!hasStudyGuidanceGroupAccess && alreadyAccess) {
    await modifyRights(user.username, { studyGuidanceGroups: false })
  }
}

module.exports = {
  byUsername,
  byUsernameMinified,
  updateUser,
  findAll,
  byId,
  getUserProgrammes,
  addProgrammes,
  removeProgrammes,
  login,
  superlogin,
  modifyRights,
  getUserAccessGroups,
  getRoles,
  getUserData,
  setFaculties,
}
