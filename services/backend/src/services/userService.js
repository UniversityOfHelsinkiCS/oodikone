const Sequelize = require('sequelize')
const { Op } = Sequelize
const LRU = require('lru-cache')
const { getStudentnumbersByElementdetails } = require('./students')
const { facultiesAndProgrammesForTrends } = require('../services/organisations')
const { sendNotificationAboutNewUser } = require('../services/mailservice')
const { checkStudyGuidanceGroupsAccess, getAllStudentsUserHasInGroups } = require('../services/studyGuidanceGroups')
const _ = require('lodash')
const { User, UserElementDetails, AccessGroup, UserFaculties, sequelizeUser } = require('../models/models_user')
const { getOrganizationAccess } = require('../util/organizationAccess')

const courseStatisticsGroup = 'grp-oodikone-basic-users'
const hyOneGroup = 'hy-one'
const toskaGroup = 'grp-toska'

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
  {
    separate: true,
    model: UserFaculties,
    as: 'faculty',
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

// Crud things from old userservice

// some fields that frontend needs
const formatUserForAdminView = user => ({
  ...user.get(),
  elementdetails: user.programme.map(p => p.elementDetailCode),
  is_enabled: true, // this is probably not needed: is here mainly because old userservice created users for every logged in user, even if they hadn't correct iamgroups
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
  return formatUserForAdminView(await byUsername(username))
}

const enableElementDetails = async (id, codes) => {
  await addProgrammes(id, codes)
  const user = await byId(id)
  userDataCache.del(user.username)
  return formatUserForAdminView(user)
}

const setFaculties = async (id, faculties) => {
  await sequelizeUser.transaction(async transaction => {
    await UserFaculties.destroy({ where: { userId: id }, transaction })
    for (const faculty of faculties) {
      await UserFaculties.create({ userId: id, faculty_code: faculty }, { transaction })
    }
  })
  const user = await byId(id)
  userDataCache.del(user.username)
  return formatUserForAdminView(user)
}

const removeElementDetails = async (id, codes) => {
  await removeProgrammes(id, codes)
  const user = await byId(id)
  userDataCache.del(user.userId)
  return formatUserForAdminView(user)
}

const updateUser = async (username, fields) => {
  const user = await byUsername(username)
  if (!user) {
    throw new Error(`User ${username} not found`)
  }
  await User.upsert({ id: user.id, ...fields })
  user.update(fields)

  userDataCache.del(username)

  return formatUserForAdminView(await byUsername(username))
}

const getAccessGroups = async () => await AccessGroup.findAll()

// newer logic
const enrichProgrammesFromFaculties = faculties =>
  facultiesAndProgrammesForTrends.filter(f => faculties.includes(f.faculty_code)).map(f => f.programme_code)

const findAll = async () =>
  (
    await User.findAll({
      include: userIncludes,
    })
  ).map(user => ({
    ...user.get(),
    is_enabled: true,
    elementdetails: _.uniqBy([
      ...user.programme.map(p => p.elementDetailCode),
      ...enrichProgrammesFromFaculties(user.faculty.map(f => f.faculty_code)),
    ]),
  }))

const formatUser = async userFromDb => {
  const [accessGroups, programmes, faculties] = [
    ['accessgroup', 'group_code'],
    ['programme', 'elementDetailCode'],
    ['faculty', 'faculty_code'],
  ].map(([field, code]) => userFromDb[field].map(entry => entry[code]))

  const rights = _.uniqBy([...programmes, ...enrichProgrammesFromFaculties(faculties)])

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

  const studentsUserCanAccess = _.uniqBy(
    (await Promise.all([getStudentnumbersByElementdetails(rights), getAllStudentsUserHasInGroups(sisPersonId)])).flat()
  )

  // attribute naming is a bit confusing, but it's used so widely in oodikone, that it's not probably worth changing
  return {
    id, // our internal id, not the one from sis, (e.g. 101)
    userId, // acually username (e.g. mluukkai)
    name,
    language,
    sisPersonId, //
    iamGroups,
    email,
    is_enabled: true, // this is probably not needed: is here mainly because old userservice created users for every logged in user, even if they hadn't correct iamgroups
    rights,
    roles: accessGroups,
    studentsUserCanAccess, // studentnumbers used in various parts of backend. For admin this is usually empty, since no programmes / faculties are set.
    isAdmin: accessGroups.includes('admin'),
  }
}

const getMockedUser = async ({ userToMock, mockedBy }) => {
  if (userDataCache.has(userToMock)) {
    return userDataCache.get(userToMock)
  }
  const toReturn = {
    ...(await formatUser(await byUsername(userToMock))),
    mockedBy,
  }
  userDataCache.set(userToMock, toReturn)
  return toReturn
}

const getUser = async ({ username, name, email, iamGroups, sisId }) => {
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
    iam_groups: iamGroups,
    last_login: new Date(),
  })

  const userFromDb = await byUsername(username)
  const formattedUser = await formatUser(userFromDb)
  const { roles: currentAccessGroups } = formattedUser

  // Modify accessgroups based on current groups and iamGroups
  let newAccessGroups = []
  if (await checkStudyGuidanceGroupsAccess(sisId)) newAccessGroups.push('studyGuidanceGroups')
  if (iamGroups.includes(courseStatisticsGroup)) newAccessGroups.push('courseStatistics')
  if (iamGroups.includes(hyOneGroup) || currentAccessGroups.includes('teachers')) newAccessGroups.push('teachers')
  if (iamGroups.includes(toskaGroup) || currentAccessGroups.includes('admin')) newAccessGroups.push('admin')
  if (_.difference(newAccessGroups, currentAccessGroups).length > 0) {
    userFromDb.setAccessgroup(
      (
        await AccessGroup.findAll({
          where: {
            group_code: {
              [Op.in]: newAccessGroups,
            },
          },
        })
      ).map(({ id }) => id)
    )
  }
  const iamRights = Object.keys(await getOrganizationAccess(formattedUser))

  if (isNewUser) await sendNotificationAboutNewUser({ userId: username, userFullName: name })

  const toReturn = {
    ...formattedUser,
    roles: newAccessGroups,
    iamRights,
  }
  userDataCache.set(username, toReturn)
  return toReturn
}

module.exports = {
  updateUser,
  enableElementDetails,
  removeElementDetails,
  findAll,
  modifyAccess,
  getAccessGroups,
  setFaculties,
  getUser,
  getMockedUser,
}
