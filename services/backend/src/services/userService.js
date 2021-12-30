const UnitService = require('./units')
const elementDetailService = require('./elementdetails')
const { filterStudentnumbersByAccessrights } = require('./students')
const { userDataCache } = require('./cache')
const { getImporterClient } = require('../util/importerClient')
const logger = require('../util/logger')
const { facultiesAndProgrammesForTrends } = require('../services/organisations')
const User = require('./users/users')
const AccessGroup = require('./users/accessgroups')
const _ = require('lodash')

// Private helpers
const enrichProgrammesFromFaculties = faculties =>
  facultiesAndProgrammesForTrends.filter(f => faculties.includes(f.faculty_code)).map(f => f.programme_code)

const enrichWithProgrammes = toEnrich => {
  if (Array.isArray(toEnrich)) {
    return toEnrich.map(obj => enrichWithProgrammes(obj))
  }
  if (toEnrich.rights) {
    return {
      ...toEnrich,
      rights: _.union(toEnrich.rights, enrichProgrammesFromFaculties(toEnrich.faculties)),
    }
  }

  if (toEnrich.elementdetails) {
    return {
      ...toEnrich,
      elementdetails: _.union(
        toEnrich.elementdetails,
        enrichProgrammesFromFaculties(toEnrich.faculty.map(f => f.faculty_code))
      ),
    }
  }
  return toEnrich
}
const checkStudyGuidanceGroupsAccess = async hyPersonSisuId => {
  if (!hyPersonSisuId) {
    logger.error('Not possible to get groups without personId header')
    return false
  }
  const importerClient = getImporterClient()
  if (!importerClient) return false
  const answerTimeout = new Promise(resolve => setTimeout(resolve, 2000))
  const result = await Promise.race([importerClient.get(`/person-groups/person/${hyPersonSisuId}`), answerTimeout])
  if (!result) return false
  const { data } = result
  return data && Object.values(data).length > 0
}

const byUsernameData = async username => {
  // OK, enriched
  const user = await User.byUsernameMinified(username)
  const roles = user.accessgroup.map(({ group_code }) => group_code)
  const rights = User.getUserProgrammes(user)
  const faculties = user.faculty.map(({ faculty_code }) => faculty_code)
  const data = {
    email: user.email,
    full_name: user.full_name,
    roles,
    rights,
    faculties,
  }
  return enrichWithProgrammes(data)
}

// Exported helpers
const getUserDataFor = async username => {
  // no need to enrich
  let userData = userDataCache.get(username)
  if (!userData) {
    userData = await byUsernameData(username)
    userDataCache.set(username, userData)
  }

  return {
    ...userData,
    faculties: new Set(userData.faculties),
  }
}

const getUnitsFromElementDetails = async username => {
  // No need to enrich
  let userData = userDataCache.get(username)
  if (!userData) {
    userData = await byUsernameData(username)
    userDataCache.set(username, userData)
  }
  const elementDetails = await elementDetailService.byCodes(userData.rights)
  return elementDetails.map(element => UnitService.parseUnitFromElement(element))
}

const getStudentsUserCanAccess = async (studentnumbers, roles, userId) => {
  // No need to enrich
  let studentsUserCanAccess
  if (roles?.includes('admin')) {
    studentsUserCanAccess = new Set(studentnumbers)
  } else {
    const unitsUserCanAccess = await getUnitsFromElementDetails(userId)
    const codes = unitsUserCanAccess.map(unit => unit.id)
    studentsUserCanAccess = new Set(await filterStudentnumbersByAccessrights(studentnumbers, codes))
  }
  return studentsUserCanAccess
}

// FOR ROUTES 1-to-1 mapping
const modifyAccess = async body => {
  const { username, accessgroups } = body
  await User.modifyRights(username, accessgroups)
  const user = await User.byUsername(username)
  return enrichWithProgrammes(User.getUserData(user))
}

const getAccessGroups = async () => enrichWithProgrammes(await AccessGroup.findAll())

const enableElementDetails = async (uid, codes) => {
  await User.addProgrammes(uid, codes)
  const user = await User.byId(uid)
  return enrichWithProgrammes(User.getUserData(user))
}

const findAll = async () => enrichWithProgrammes((await User.findAll()).map(User.getUserData))

const setFaculties = async (uid, faculties) => {
  await User.setFaculties(uid, faculties)
  const user = await User.byId(uid)
  return enrichWithProgrammes(User.getUserData(user))
}

const removeElementDetails = async (uid, codes) => {
  await User.removeProgrammes(uid, codes)
  const user = await User.byId(uid)
  return enrichWithProgrammes(User.getUserData(user))
}

const updateUser = async (username, fields) => {
  userDataCache.del(username)
  const uid = username
  const user = await User.byUsername(uid)
  if (!user) {
    throw new Error(`User ${uid} not found`)
  }
  await User.updateUser(user, fields)
  const returnedUser = await User.byUsername(username)
  return enrichWithProgrammes(User.getUserData(returnedUser))
}

const getLoginDataWithoutToken = async (uid, full_name, hyGroups, email, hyPersonSisuId) => {
  const hasStudyGuidanceGroupAccess = await checkStudyGuidanceGroupsAccess(hyPersonSisuId)
  const result = await User.loginWithoutToken(
    uid,
    full_name,
    hyGroups,
    email,
    hyPersonSisuId,
    hasStudyGuidanceGroupAccess
  )
  return result
}

const superlogin = async (uid, asUser) => await User.superlogin(uid, asUser)

const getUser = async ({ username, name, email, iamGroups, sisId }) => {
  const { payload: user, isNew } = await getLoginDataWithoutToken(username, name, iamGroups, email, sisId)
  if (isNew) {
    //console.log('send mail here')
  }
  return user
}

module.exports = {
  updateUser,
  superlogin,
  enableElementDetails,
  removeElementDetails,
  findAll,
  modifyAccess,
  getAccessGroups,
  getUnitsFromElementDetails,
  setFaculties,
  getUserDataFor,
  getStudentsUserCanAccess,
  getLoginDataWithoutToken,
  getUser,
}
