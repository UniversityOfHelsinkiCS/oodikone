require('dotenv').config()
const axios = require('axios')
const https = require('https')
const fs = require('fs')

const { OODI_ADDR, KEY_PATH, CERT_PATH } = process.env
const base_url = OODI_ADDR

const agent = KEY_PATH && CERT_PATH ?
  new https.Agent({
    cert: fs.readFileSync(process.env.CERT_PATH, 'utf8'),
    key: fs.readFileSync(process.env.KEY_PATH, 'utf8'),
  })
  :
  new https.Agent({
    rejectUnauthorized: false
  })

const instance = axios.create({
  httpsAgent: agent
})

const getUrl = instance.get

const getOodiApi = async relative => {
  const route = base_url + relative
  const stuff = await getUrl(route)
  return stuff
}

const attemptGetFor = async (url, attempts = 5) => {
  let attempt = 0
  let response = 0
  while (attempt <= attempts) {
    attempt += 1
    try {
      response = await getUrl(url)
      return response
    } catch (error) {
      if (attempt === attempts) {
        throw error
      }
    }
  }
}

if (process.env.NODE_ENV === 'development') {

  // axios.defaults.auth = {
  //   username: 'tktl',
  //   password: process.env.OODI_PW
  // }
  axios.defaults.params = {
    token: process.env.TOKEN
  }

}
console.log(process.env.NODE_ENV)

const getStudent = async studentNumber => {
  const url = `${base_url}/students/${studentNumber}/info`
  try {
    const response = await getUrl(url)
    const data = response.data.data
    return data
  } catch (e) {
    throw e
  }
}

const getStudentStudyRights = async studentNumber => {
  const url = `${base_url}/students/${studentNumber}/studyrights`
  try {
    const response = await attemptGetFor(url)
    return response.data.data
  } catch (e) {
    throw e
  }
}

const getFaculties = async () => {
  const url = `${base_url}/codes/faculties`
  try {
    const response = await attemptGetFor(url)
    return response.data.data
  }
  catch (e) {
    throw e
  }
}

const getStudyAttainments = async studentNumber => {
  const url = `${base_url}/students/${studentNumber}/studyattainments`
  try {
    const response = await attemptGetFor(url)
    return response.data.data
  } catch (e) {
    throw e
  }
}

const getTeacherInfo = async id => {
  const url = `${base_url}/teachers/${id}/info`
  try {
    const response = await attemptGetFor(url)
    return response.data.data
  } catch (e) {
    throw e
  }
}

const getCourseTypeCodes = async () => {
  const url = `${base_url}/codes/learningopportunities/types`
  try {
    const response = await attemptGetFor(url)
    return response.data.data
  } catch (e) {
    throw e
  }
}

const getLearningOpportunity = async (id) => {
  const url = `${base_url}/learningopportunities/${id}`
  try {
    const response = await attemptGetFor(url)
    return response.data.data
  } catch (e) {
    throw e
  }
}

const getStudyattainmentStatusCodes = async () => {
  const url = `${base_url}/codes/studyattainments/statuses`
  const response = await attemptGetFor(url)
  return response.data.data
}

const getCourseDisciplines = async () => {
  const url = `${base_url}/codes/learningopportunities/disciplines`
  try {
    const response = await attemptGetFor(url)
    return response.data.data
  } catch (e) {
    throw e
  }
}
const getSemesters = async () => {
  const url = `${base_url}/codes/semesters`
  try {
    const response = await attemptGetFor(url)
    return response.data.data
  } catch (e) {
    throw e
  }
}

const getSemesterEnrollments = async studentnumber => {
  const url = `${base_url}/students/${studentnumber}/semesterenrollments`
  try {
    const response = await attemptGetFor(url)
    return response.data.data
  } catch (e) {
    throw e
  }
}

const getCourseEnrollments = async studentnumber => {
  const url = `${base_url}/students/${studentnumber}/enrollments`
  try {
    const response = await attemptGetFor(url)
    return response.data.data
  } catch (e) {
    throw e
  }
}

const getCourseRealisationTypes = async () => {
  const url = `${base_url}/codes/courseunitrealisations/types`
  try {
    const response = await attemptGetFor(url)
    return response.data.data
  } catch (e) {
    throw e
  }
}

const courseUnitRealisationsSince = async sinceDate => {
  const url = `${base_url}/courseunitrealisations/changes/ids/${sinceDate}`
  try {
    const response = await attemptGetFor(url)
    return response.data.data
  } catch (e) {
    throw e
  }
}

const learningOpportunitiesSince = async (sinceDate = '0000-01-01') => {
  const url = `${base_url}/learningopportunities/changes/ids/${sinceDate}`
  try {
    const response = await attemptGetFor(url)
    return response.data.data
  } catch (e) {
    throw e
  }
}

const getCourseUnitRealisation = async id => {
  const url = `${base_url}/courseunitrealisations/${id}`
  try {
    const response = await attemptGetFor(url)
    return response.data.data
  } catch (e) {
    throw e
  }
}

module.exports = {
  getStudentStudyRights,
  getStudent,
  getFaculties,
  getStudyAttainments,
  getTeacherInfo,
  getCourseTypeCodes,
  getLearningOpportunity,
  getStudyattainmentStatusCodes,
  getCourseDisciplines,
  getSemesters,
  getSemesterEnrollments,
  getCourseEnrollments,
  getCourseRealisationTypes,
  courseUnitRealisationsSince,
  getCourseUnitRealisation,
  learningOpportunitiesSince,
  getOodiApi
}