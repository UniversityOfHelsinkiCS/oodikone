const { Op } = require('sequelize')
const LRU = require('lru-cache')
const _ = require('lodash')

const { getStudentnumbersByElementdetails } = require('./students')
const { sendNotificationAboutNewUser } = require('../services/mailservice')
const { checkStudyGuidanceGroupsAccess, getAllStudentsUserHasInGroups } = require('../services/studyGuidanceGroups')
const { User, UserElementDetails, AccessGroup } = require('../models/models_user')
const { getUserIams, getAllUserAccess, getUserIamAccess } = require('../util/jami')
const { createLocaleComparator, getFullStudyProgrammeRights } = require('../util/utils')
const { sequelizeUser } = require('../database/connection')

const courseStatisticsGroup = 'grp-oodikone-basic-users'
const facultyStatisticsGroup = 'grp-oodikone-users'

// Max 25 users can be stored in the cache
const userDataCache = new LRU({
  max: 25,
  length: () => 1,
  maxAge: 1000 * 60 * 60,
})

// Stuff to work with old userservice based user-db (separate microservice, now deprecated)
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
]

const accessGroupsByCodes = codes =>
  AccessGroup.findAll({
    where: {
      group_code: {
        [Op.in]: codes,
      },
    },
  })

const byUsername = async username =>
  await User.findOne({
    where: {
      username,
    },
    include: userIncludes,
  })

const byId = async id =>
  await User.findOne({
    where: {
      id,
    },
    include: userIncludes,
  })

const deleteOutdatedUsers = async () =>
  await sequelizeUser.transaction(async t => {
    const outdatedUsersCTE = `
      WITH outdated_users AS (
        SELECT id FROM users
        WHERE last_login IS NULL OR last_login < CURRENT_DATE - INTERVAL '18 months'
      )`

    await sequelizeUser.query(
      `${outdatedUsersCTE} DELETE FROM user_faculties WHERE "userId" IN (SELECT id FROM outdated_users)`,
      { transaction: t }
    )
    await sequelizeUser.query(
      `${outdatedUsersCTE} DELETE FROM user_accessgroup WHERE "userId" IN (SELECT id FROM outdated_users)`,
      { transaction: t }
    )
    await sequelizeUser.query(
      `${outdatedUsersCTE} DELETE FROM user_elementdetails WHERE "userId" IN (SELECT id FROM outdated_users)`,
      { transaction: t }
    )
    const [results] = await sequelizeUser.query(
      `${outdatedUsersCTE} DELETE FROM users WHERE id IN (SELECT id FROM outdated_users) RETURNING id`,
      { transaction: t }
    )

    return results.length
  })

const addProgrammes = async (id, codes) => {
  for (const code of codes) {
    await UserElementDetails.upsert({ userId: id, elementDetailCode: code })
  }
  const user = await byId(id)
  userDataCache.del(user.username)
}

const removeProgrammes = async (id, codes) => {
  for (const code of codes) {
    await UserElementDetails.destroy({
      where: { userId: id, elementDetailCode: code },
    })
  }
  const user = await byId(id)
  userDataCache.del(user.username)
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
  const accessGroupsToAdd = await accessGroupsByCodes(rightsToAdd)
  const accessGroupsToRemove = await accessGroupsByCodes(rightsToRemove)

  await user.addAccessgroup(accessGroupsToAdd)
  await user.removeAccessgroup(accessGroupsToRemove)
  userDataCache.del(username)
}

const modifyAccess = async body => {
  const { username, accessgroups } = body
  await modifyRights(username, accessgroups)
  userDataCache.del(username)
  const updatedUser = await byUsername(username)
  return updatedUser
}

const enableElementDetails = async (id, codes) => {
  await addProgrammes(id, codes)
  const user = await byId(id)
  userDataCache.del(user.username)
  return user
}

const removeElementDetails = async (id, codes) => {
  await removeProgrammes(id, codes)
  const user = await byId(id)
  userDataCache.del(user.userId)
  return user
}

const updateUser = async (username, fields) => {
  const user = await byUsername(username)
  if (!user) {
    throw new Error(`User ${username} not found`)
  }
  await User.upsert({ id: user.id, ...fields })
  user.update(fields)

  userDataCache.del(username)

  const updatedUser = await byUsername(username)
  return updatedUser
}

const getAccessGroups = async () => await AccessGroup.findAll()

const getStudyProgrammeRights = (iamAccess, specialGroup, userProgrammes) => {
  const iamBasedProgrammes = []

  for (const [programmeCode, rights] of Object.entries(iamAccess || {})) {
    if (specialGroup.kosu || rights.admin) {
      iamBasedProgrammes.push({ code: programmeCode, limited: false, isIamBased: true })
    } else {
      iamBasedProgrammes.push({ code: programmeCode, limited: true, isIamBased: true })
    }
  }

  return [
    ...iamBasedProgrammes,
    ...userProgrammes.map(({ elementDetailCode }) => ({
      code: elementDetailCode,
      limited: false,
      isIamBased: false,
    })),
  ]
}

const updateAccessGroups = async (username, iamGroups = [], specialGroup = {}, sisId, user) => {
  const { jory, hyOne, superAdmin, openUni, katselmusViewer } = specialGroup

  const userFromDb = user || (await byUsername(username))
  const formattedUser = await formatUser(userFromDb, [], [], Boolean(sisId))

  const { roles: currentAccessGroups } = formattedUser

  // Modify accessgroups based on current groups and iamGroups
  let newAccessGroups = []
  if (currentAccessGroups.includes('studyGuidanceGroups') || (sisId && (await checkStudyGuidanceGroupsAccess(sisId))))
    newAccessGroups.push('studyGuidanceGroups')
  if (iamGroups.includes(courseStatisticsGroup)) newAccessGroups.push('courseStatistics')
  if (jory || iamGroups.includes(facultyStatisticsGroup)) newAccessGroups.push('facultyStatistics')
  if (hyOne || currentAccessGroups.includes('teachers')) newAccessGroups.push('teachers')
  if (superAdmin || currentAccessGroups.includes('admin')) newAccessGroups.push('admin')
  if (openUni) newAccessGroups.push('openUniSearch')
  if (katselmusViewer) newAccessGroups.push('katselmusViewer')

  const accessGroups = await AccessGroup.findAll({
    where: {
      group_code: {
        [Op.in]: newAccessGroups,
      },
    },
  })

  // In the difference method "the order and references of result values are determined by the first array." https://lodash.com/docs/4.17.15#difference
  // Both directions needs to be checked in order to update roles when the access should no longer exists.
  if (
    _.difference(newAccessGroups, currentAccessGroups).length > 0 ||
    _.difference(currentAccessGroups, newAccessGroups).length > 0
  ) {
    userFromDb.setAccessgroup(accessGroups.map(({ id }) => id))
  }

  return { newAccessGroups, accessGroups }
}

const findAll = async () => {
  const allUsers = await User.findAll({
    include: userIncludes,
  })

  const userAccess = await getAllUserAccess()

  const userAccessMap = userAccess.reduce((obj, cur) => {
    obj[cur.id] = cur
    return obj
  }, {})

  const formattedUsers = await Promise.all(
    allUsers.map(async user => {
      const { iamGroups, specialGroup, access } = userAccessMap[user.sisu_person_id] || {}

      const { accessGroups } = await updateAccessGroups(user.username, iamGroups, specialGroup, null, user)

      return {
        ...user.get(),
        iam_groups: iamGroups || [],
        accessgroup: accessGroups,
        programmeRights: getStudyProgrammeRights(access, specialGroup, user.programme),
      }
    })
  )
  return formattedUsers.sort(createLocaleComparator('full_name'))
}

const findOne = async id => {
  const user = await byId(id)
  if (!user) {
    throw new Error(`User with id ${id} not found`)
  }

  const userIams = await getUserIams(user.sisu_person_id)

  user.iamGroups = userIams

  const { iamAccess, specialGroup } = await getUserIamAccess(user)

  const { accessGroups } = await updateAccessGroups(user.username, userIams, specialGroup)

  return {
    ...user.get(),
    iam_groups: iamAccess || [],
    accessgroup: accessGroups,
    programmeRights: getStudyProgrammeRights(iamAccess, specialGroup, user.programme),
  }
}

const formatUser = async (userFromDb, extraRights, programmeRights, getStudentAccess = true) => {
  const accessGroups = userFromDb.accessgroup.map(entry => entry.group_code)

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  const {
    dataValues: {
      id,
      username: userId,
      full_name: name,
      email,
      language,
      sisu_person_id: sisPersonId,
      iam_groups: iamGroups,
    },
  } = userFromDb

  const studentsUserCanAccess = getStudentAccess
    ? _.uniqBy(
        (
          await Promise.all([
            getStudentnumbersByElementdetails(fullStudyProgrammeRights),
            getAllStudentsUserHasInGroups(sisPersonId),
          ])
        ).flat()
      )
    : []

  // attribute naming is a bit confusing, but it's used so widely in oodikone, that it's not probably worth changing
  return {
    id, // our internal id, not the one from sis, (e.g. 101)
    userId, // acually username (e.g. mluukkai)
    name,
    language,
    sisPersonId, //
    iamGroups,
    email,
    roles: accessGroups,
    studentsUserCanAccess, // studentnumbers used in various parts of backend. For admin this is usually empty, since no programmes / faculties are set.
    isAdmin: accessGroups.includes('admin'),
    programmeRights,
  }
}

const getOrganizationAccess = async user => {
  if (!user.iamGroups) user.iamGroups = user.iam_groups

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

const getMockedUser = async ({ userToMock, mockedBy }) => {
  // Using different keys for users being mocked to prevent users from seeing
  // themselves as mocked. Also, if the user is already logged in, we don't want
  // the regular data from the cache because that doesn't have the mockedBy field
  if (userDataCache.has(`mocking-as-${userToMock}`)) {
    const userFromCache = userDataCache.get(`mocking-as-${userToMock}`)
    if (userFromCache.mockedBy !== mockedBy) {
      userFromCache.mockedBy = mockedBy
      userDataCache.set(`mocking-as-${userToMock}`, userFromCache)
    }
    return userFromCache
  }

  const userFromDb = await byUsername(userToMock)
  userFromDb.iamGroups = await getUserIams(userFromDb.sisu_person_id)

  const { access = {}, specialGroup = {} } = await getOrganizationAccess(userFromDb)

  const iamRights = Object.keys(access)

  const programmeRights = getStudyProgrammeRights(access, specialGroup, userFromDb.programme)

  const formattedUser = await formatUser(userFromDb, specialGroup.kosu ? iamRights : [], programmeRights)

  const toReturn = {
    ...formattedUser,
    iamRights,
    specialGroup,
    mockedBy,
    iamGroups: userFromDb.iamGroups,
  }
  userDataCache.set(`mocking-as-${userToMock}`, toReturn)

  return toReturn
}

const getUser = async ({ username, name, email, iamGroups, iamRights, specialGroup, sisId, access }) => {
  if (userDataCache.has(username)) {
    return userDataCache.get(username)
  }

  const isNewUser = !(await User.findOne({ where: { username } }))
  const language = 'fi'

  await User.upsert({
    full_name: name,
    username,
    email,
    language,
    sisu_person_id: sisId,
    last_login: new Date(),
  })

  const userFromDb = await byUsername(username)
  userFromDb.iamGroups = await getUserIams(userFromDb.sisu_person_id)
  const programmeRights = getStudyProgrammeRights(access, specialGroup, userFromDb.programme)
  const formattedUser = await formatUser(userFromDb, specialGroup.kosu ? iamRights : [], programmeRights)

  const { newAccessGroups } = await updateAccessGroups(username, iamGroups, specialGroup, sisId)

  if (isNewUser) await sendNotificationAboutNewUser({ userId: username, userFullName: name })

  const toReturn = {
    ...formattedUser,
    iamRights,
    iamGroups: userFromDb.iamGroups,
    roles: newAccessGroups,
  }
  userDataCache.set(username, toReturn)
  return toReturn
}

module.exports = {
  updateUser,
  enableElementDetails,
  removeElementDetails,
  findAll,
  findOne,
  modifyAccess,
  getAccessGroups,
  getUser,
  getMockedUser,
  getOrganizationAccess,
  deleteOutdatedUsers,
}
