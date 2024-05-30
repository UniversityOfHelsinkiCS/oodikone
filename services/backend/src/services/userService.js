const _ = require('lodash')
const { LRUCache } = require('lru-cache')

const { sendNotificationAboutNewUser } = require('./mailservice')
const { getStudentnumbersByElementdetails } = require('./students')
const { checkStudyGuidanceGroupsAccess, getAllStudentsUserHasInGroups } = require('./studyGuidanceGroups')
const { serviceProvider } = require('../conf-backend')
const { sequelizeUser } = require('../database/connection')
const { User } = require('../models/models_user')
const { getUserIams, getAllUserAccess, getUserIamAccess } =
  serviceProvider === 'Toska' ? require('../util/jami') : require('../util/mami')
const { createLocaleComparator, getFullStudyProgrammeRights, hasFullAccessToStudentData } = require('../util/utils')

const courseStatisticsGroup = 'grp-oodikone-basic-users'
const facultyStatisticsGroup = 'grp-oodikone-users'

const roles = [
  'teachers',
  'admin',
  'courseStatistics',
  'studyGuidanceGroups',
  'facultyStatistics',
  'openUniSearch',
  'katselmusViewer',
  'fullSisuAccess',
]

// Max 25 users can be stored in the cache, and the data is valid for 1 hour
const userDataCache = new LRUCache({ max: 25, ttl: 1000 * 60 * 60 })

const findUser = async where => User.findOne({ where })

const deleteOutdatedUsers = async () =>
  sequelizeUser.query("DELETE FROM users WHERE last_login < CURRENT_DATE - INTERVAL '18 months'")

const modifyAccess = async (username, roles) => {
  const user = await findUser({ username })
  const rolesToAdd = Object.keys(roles).filter(code => roles[code])
  user.roles = rolesToAdd
  await user.save()
  userDataCache.delete(username)
}

const modifyElementDetails = async (id, codes, enable) => {
  const user = await findUser({ id })
  if (enable === true) {
    user.programmeRights = _.uniq([...user.programmeRights, ...codes])
  } else {
    user.programmeRights = user.programmeRights.filter(code => !codes.includes(code))
  }
  await user.save()
  userDataCache.delete(user.username)
}

const updateUser = async (username, fields) => {
  const user = await findUser({ username })
  if (!user) throw new Error(`User ${username} not found`)
  await user.update(fields)
  userDataCache.delete(username)
}

const getStudyProgrammeRights = (iamAccess, specialGroup, userProgrammes) => [
  ...(specialGroup?.fullSisuAccess
    ? []
    : Object.entries(iamAccess || {}).map(([code, rights]) => ({
        code,
        limited: !rights.admin,
        isIamBased: true,
      }))),
  ...userProgrammes.map(code => ({ code, limited: false, isIamBased: false })),
]

const formatUser = async (user, getStudentAccess = true) => {
  const { roles } = user
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(user.programmeRights)

  // No need to fetch student numbers if the user already has full access to student data
  const studentsUserCanAccess =
    !getStudentAccess || hasFullAccessToStudentData(roles)
      ? []
      : _.uniqBy(
          (
            await Promise.all([
              getStudentnumbersByElementdetails(fullStudyProgrammeRights),
              getAllStudentsUserHasInGroups(user.sisu_person_id),
            ])
          ).flat()
        )

  // attribute naming is a bit confusing, but it's used so widely in oodikone, that it's not probably worth changing
  return {
    id: user.id, // our internal id, not the one from sis, (e.g. 101)
    userId: user.username, // This is only used for logging purposes (Grafana), please use either id or username for everything else
    username: user.username,
    name: user.fullName,
    language: user.language,
    sisPersonId: user.sisuPersonId,
    email: user.email,
    roles,
    studentsUserCanAccess, // studentnumbers used in various parts of backend. For admin this is usually empty, since no programmes / faculties are set.
    isAdmin: roles.includes('admin'),
    programmeRights: user.programmeRights,
    iamGroups: user.iamGroups || [],
    mockedBy: user.mockedBy,
    lastLogin: user.lastLogin,
  }
}

const formatUserForFrontend = async user => {
  const formattedUser = await formatUser(user, false)
  return _.omit(formattedUser, ['studentsUserCanAccess', 'isAdmin', 'mockedBy', 'userId'])
}

const updateAccessGroups = async (username, iamGroups, specialGroup, sisId) => {
  const { jory, hyOne, superAdmin, openUni, katselmusViewer, fullSisuAccess } = specialGroup
  const userFromDb = await findUser({ username })
  const currentAccessGroups = userFromDb.roles

  const newAccessGroups = [
    ...(currentAccessGroups.includes('studyGuidanceGroups') || (await checkStudyGuidanceGroupsAccess(sisId))
      ? ['studyGuidanceGroups']
      : []),
    ...(iamGroups.includes(courseStatisticsGroup) ? ['courseStatistics'] : []),
    ...(jory || iamGroups.includes(facultyStatisticsGroup) ? ['facultyStatistics'] : []),
    ...(hyOne || currentAccessGroups.includes('teachers') ? ['teachers'] : []),
    ...(superAdmin || currentAccessGroups.includes('admin') ? ['admin'] : []),
    ...(openUni ? ['openUniSearch'] : []),
    ...(katselmusViewer ? ['katselmusViewer'] : []),
    ...(fullSisuAccess ? ['fullSisuAccess'] : []),
  ]

  if (!_.isEqual(newAccessGroups.sort(), currentAccessGroups.sort())) {
    userFromDb.roles = newAccessGroups
    await userFromDb.save()
  }
}

const findAll = async () => {
  const users = (await User.findAll()).map(user => user.toJSON())
  const userAccess = await getAllUserAccess(users.map(user => user.sisuPersonId))
  const userAccessMap = _.keyBy(userAccess, 'id')

  const formattedUsers = await Promise.all(
    users.map(async user => {
      const { iamGroups, specialGroup, access } = userAccessMap[user.sisuPersonId] || {}
      const programmeRights = getStudyProgrammeRights(access, specialGroup, user.programmeRights)
      const formattedUser = await formatUserForFrontend({ ...user, programmeRights, iamGroups })
      return formattedUser
    })
  )
  return formattedUsers.sort(createLocaleComparator('name'))
}

const findOne = async id => {
  const user = (await findUser({ id })).toJSON()
  if (!user) throw new Error(`User with id ${id} not found`)

  const iamGroups = await getUserIams(user.sisuPersonId)
  const { iamAccess, specialGroup } = await getUserIamAccess(user.sisuPersonId, iamGroups)
  const programmeRights = getStudyProgrammeRights(iamAccess, specialGroup, user.programmeRights)
  const formattedUser = await formatUserForFrontend({ ...user, programmeRights, iamGroups })
  return formattedUser
}

const getOrganizationAccess = async (sisPersonId, iamGroups) => {
  if (!iamGroups.length) return {}
  const { iamAccess, specialGroup } = await getUserIamAccess(sisPersonId, iamGroups)
  return { access: iamAccess || {}, specialGroup }
}

const getMockedUser = async ({ userToMock, mockedBy }) => {
  // Using different keys for users being mocked to prevent users from seeing themselves as mocked. Also, if the user
  // is already logged in, we don't want the regular data from the cache because that doesn't have the mockedBy field
  const cacheKey = `mocking-as-${userToMock}`
  if (userDataCache.has(cacheKey)) {
    const cachedUser = userDataCache.get(cacheKey)
    if (cachedUser.mockedBy !== mockedBy) {
      cachedUser.mockedBy = mockedBy
      userDataCache.set(cacheKey, cachedUser)
    }
    return cachedUser
  }

  const userFromDb = (await findUser({ username: userToMock })).toJSON()
  const iamGroups = await getUserIams(userFromDb.sisuPersonId)
  const { access, specialGroup } = await getOrganizationAccess(userFromDb.sisuPersonId, iamGroups)
  const programmeRights = getStudyProgrammeRights(access, specialGroup, userFromDb.programmeRights)

  const mockedUser = await formatUser({ ...userFromDb, iamGroups, programmeRights, mockedBy })
  userDataCache.set(cacheKey, mockedUser)
  return mockedUser
}

const toskaGetUser = async ({ username, name, email, iamGroups, specialGroup, sisId, access }) => {
  if (userDataCache.has(username)) return userDataCache.get(username)

  const isNewUser = !(await User.findOne({ where: { username } }))
  await User.upsert({ fullName: name, username, email, sisuPersonId: sisId, lastLogin: new Date() })
  await updateAccessGroups(username, iamGroups, specialGroup, sisId)
  const userFromDb = (await findUser({ username })).toJSON()

  const programmeRights = getStudyProgrammeRights(access, specialGroup, userFromDb.programmeRights)
  const user = await formatUser({ ...userFromDb, iamGroups, programmeRights })
  if (isNewUser) await sendNotificationAboutNewUser({ userId: username, userFullName: name })
  userDataCache.set(username, user)
  return user
}

const fdGetUser = async ({ username }) => {
  if (userDataCache.has(username)) return userDataCache.get(username)

  await User.upsert({ username, lastLogin: new Date() })

  const userFromDb = (await findUser({ username })).toJSON()

  if (!userFromDb) return null

  const programmeRights = getStudyProgrammeRights({}, {}, userFromDb.programmeRights)
  const user = await formatUser({ ...userFromDb, iamGroups: [], programmeRights })

  userDataCache.set(username, user)
  return user
}

const getUser = serviceProvider === 'Toska' ? toskaGetUser : fdGetUser

module.exports = {
  updateUser,
  modifyElementDetails,
  findAll,
  findOne,
  modifyAccess,
  getUser,
  getMockedUser,
  getOrganizationAccess,
  deleteOutdatedUsers,
  roles,
}
