const axios = require('axios')
const { USERSERVICE_URL } = require('../conf-backend')
const UnitService = require('./units')
const elementDetailService = require('./elementdetails')
const { filterStudentnumbersByAccessrights } = require('./students')
const { userDataCache } = require('./cache')
const client = axios.create({ baseURL: USERSERVICE_URL, headers: { secret: process.env.USERSERVICE_SECRET } })
const { getImporterClient } = require('../util/importerClient')
const logger = require('../util/logger')
const { facultiesAndProgrammesForTrends } = require('../services/organisations')

const enrichProgrammesFromFaculties = faculties =>
  facultiesAndProgrammesForTrends.filter(f => faculties.includes(f.faculty_code)).map(f => f.programme_code)

const enrichObjectsElementDetails = obj => ({
  ...obj,
  elementdetails: [...new Set([...obj.elementdetails, ...enrichProgrammesFromFaculties(obj.faculty)])],
})

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

const login = async (uid, full_name, hyGroups, affiliations, email, hyPersonSisuId) => {
  const hasStudyGuidanceGroupAccess = await checkStudyGuidanceGroupsAccess(hyPersonSisuId)
  const response = await client.post('/login', {
    uid,
    full_name,
    hyGroups,
    affiliations,
    email,
    hyPersonSisuId,
    hasStudyGuidanceGroupAccess,
  })
  return response.data
}

const findAll = async () => {
  return (await client.get('/findall'))?.data?.map(user => enrichObjectsElementDetails(user)) || []
}

const superlogin = async (uid, asUser) => {
  const response = await client.post('/superlogin', {
    uid,
    asUser,
  })
  return response.data
}

const byUsername = async uid => {
  const url = `/user/${uid}`
  const response = await client.get(url)
  return response.data
}

const byUsernameData = async uid => {
  const url = `/user/${uid}/user_data`
  const response = await client.get(url)
  return response.data
}

const getUserElementDetails = async username => {
  const url = `/user/elementdetails/${username}`
  const response = await client.get(url)
  const elementdetailcodes = response.data
  return elementDetailService.byCodes(elementdetailcodes)
}

const byId = async id => {
  const url = `/user/id/${id}`
  const response = await client.get(url)
  return response.data
}

const updateUser = async (uid, fields) => {
  userDataCache.del(uid)
  const url = `/user/${uid}`
  const response = await client.put(url, fields)
  return response.data
}

const getRolesFor = async user => {
  const url = `/get_roles/${user}`
  const response = await client.get(url)
  return response.data
}

const enableElementDetails = async (uid, codes) => {
  const response = await client.post('/add_rights', { uid, codes })
  return response.data.user
}

const removeElementDetails = async (uid, codes) => {
  const response = await client.post('/remove_rights', { uid, codes })
  return response.data.user
}

const setFaculties = async (uid, faculties) => {
  const response = await client.post('/set_faculties', { uid, faculties })
  return response.data.user
}

const getUnitsFromElementDetails = async username => {
  const elementDetails = await getUserElementDetails(username)
  return elementDetails.map(element => UnitService.parseUnitFromElement(element))
}

const modifyAccess = async body => {
  const response = await client.post('/modifyaccess', body)
  return response.data
}

const getAccessGroups = async () => {
  const response = await client.get('/access_groups')
  return response.data
}

const getUserDataFor = async uid => {
  let userData = userDataCache.get(uid)
  if (!userData) {
    userData = await byUsernameData(uid)
    userDataCache.set(uid, userData)
  }

  return {
    ...userData,
    faculties: new Set(userData.faculties),
  }
}

const getStudentsUserCanAccess = async (studentnumbers, roles, userId) => {
  let studentsUserCanAccess
  if (roles && roles.includes('admin')) {
    studentsUserCanAccess = new Set(studentnumbers)
  } else {
    const unitsUserCanAccess = await getUnitsFromElementDetails(userId)
    const codes = unitsUserCanAccess.map(unit => unit.id)
    studentsUserCanAccess = new Set(await filterStudentnumbersByAccessrights(studentnumbers, codes))
  }
  return studentsUserCanAccess
}

module.exports = {
  byUsername,
  updateUser,
  byId,
  getUserElementDetails,
  login,
  superlogin,
  enableElementDetails,
  removeElementDetails,
  findAll,
  modifyAccess,
  getAccessGroups,
  getUnitsFromElementDetails,
  getRolesFor,
  setFaculties,
  getUserDataFor,
  getStudentsUserCanAccess,
}
