const axios = require('axios')
const _ = require('lodash')
const { USERSERVICE_URL } = require('../conf-backend')
const UnitService = require('./units')
const elementDetailService = require('./elementdetails')
const { filterStudentnumbersByAccessrights } = require('./students')
const { userDataCache } = require('./cache')
const { getImporterClient } = require('../util/importerClient')
const logger = require('../util/logger')
const { facultiesAndProgrammesForTrends } = require('../services/organisations')

const client = axios.create({ baseURL: USERSERVICE_URL, headers: { secret: process.env.USERSERVICE_SECRET } })

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
  const { data } = await importerClient.get(`/person-groups/person/${hyPersonSisuId}`)
  return data && Object.values(data).length > 0
}

const byUsernameData = async username => {
  // OK, enriched
  const url = `/user/${username}/user_data`
  const response = await client.get(url)
  return enrichWithProgrammes(response.data)
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
const modifyAccess = async body => enrichWithProgrammes((await client.post('/modifyaccess', body)).data)

const getAccessGroups = async () => enrichWithProgrammes((await client.get('/access_groups')).data)

const enableElementDetails = async (uid, codes) =>
  enrichWithProgrammes((await client.post('/add_rights', { uid, codes })).data.user)

const findAll = async () => enrichWithProgrammes((await client.get('/findall')).data)

const setFaculties = async (uid, faculties) =>
  enrichWithProgrammes((await client.post('/set_faculties', { uid, faculties })).data.user)

const removeElementDetails = async (uid, codes) =>
  enrichWithProgrammes((await client.post('/remove_rights', { uid, codes })).data.user)

const updateUser = async (username, fields) => {
  userDataCache.del(username)
  return enrichWithProgrammes((await client.put(`/user/${username}`, fields)).data)
}

const login = async (uid, full_name, hyGroups, affiliations, email, hyPersonSisuId) => {
  const hasStudyGuidanceGroupAccess = await checkStudyGuidanceGroupsAccess(hyPersonSisuId)
  return (
    await client.post('/login', {
      uid,
      full_name,
      hyGroups,
      affiliations,
      email,
      hyPersonSisuId,
      hasStudyGuidanceGroupAccess,
    })
  ).data
}

const superlogin = async (uid, asUser) =>
  (
    await client.post('/superlogin', {
      uid,
      asUser,
    })
  ).data

module.exports = {
  updateUser,
  login,
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
}
