require('dotenv').config()
const axios = require('axios')
const LRU = require('lru-cache')
const https = require('https')
const fs = require('fs')

const { OODI_ADDR, KEY_PATH, CERT_PATH } = process.env
const base_url = OODI_ADDR

const requestCache = new LRU({
  max: 25000,
  length: () => 1,
  maxAge: 60 * 60 * 1000
})

const agent =
  KEY_PATH && CERT_PATH
    ? new https.Agent({
        cert: fs.readFileSync(process.env.CERT_PATH, 'utf8'),
        key: fs.readFileSync(process.env.KEY_PATH, 'utf8')
      })
    : new https.Agent({
        rejectUnauthorized: false
      })

const instance = axios.create({
  httpsAgent: agent
})

const getUrl = async url => {
  const cacheHit = requestCache.get(url)
  if (cacheHit) return cacheHit

  const res = await instance.get(url)

  // Sometimes oodi seems to randomly return a response with status 200
  // that in reality contains an error. Check this out:
  // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/1547#issuecomment-550167612
  if (res.data.exception) {
    throw new Error(res.data.exception.message)
  }

  if (!url.includes('/students/')) requestCache.set(url, res.data.data)
  return res.data.data
}

const getOodiApi = async relative => {
  const route = base_url + relative
  const stuff = await getUrl(route)
  return stuff
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const attemptGetFor = async (url, attempts = 6) => {
  for (let attempt = 1; attempt <= attempts; ++attempt) {
    try {
      return await getUrl(url)
    } catch (error) {
      if (attempt === attempts) {
        console.log('ATTEMPT GET FOR FAILURE')
        throw error
      }
      await sleep(attempt * 5000)
    }
  }
}

if (process.env.NODE_ENV === 'development') {
  // axios.defaults.auth = {
  //   username: 'tktl',
  //   password: process.env.OODI_PW
  // }
  instance.interceptors.request.use(config => {
    config.params = { token: process.env.TOKEN }
    return config
  })
}
console.log(process.env.NODE_ENV)

const getStudent = async studentNumber => {
  const url = `${base_url}/students/${studentNumber}/info`
  try {
    return await attemptGetFor(url)
  } catch (e) {
    console.log('GET STUDENT FAILED')
    throw e
  }
}

const getStudentStudyRights = async studentNumber => {
  const url = `${base_url}/students/${studentNumber}/studyrights`
  try {
    return await attemptGetFor(url)
  } catch (e) {
    console.log('GET STUDYRIGHT FAIELD')
    throw e
  }
}

const getFaculties = async () => {
  const url = `${base_url}/codes/faculties`
  try {
    return await attemptGetFor(url)
  } catch (e) {
    console.log(' GET FACULTIE S FAIELD')
    throw e
  }
}

const getStudyAttainments = async studentNumber => {
  const url = `${base_url}/students/${studentNumber}/studyattainments`
  try {
    return await attemptGetFor(url)
  } catch (e) {
    console.log('GET STSDU ATTAINEMNT FIALE')
    throw e
  }
}

const getTeacherInfo = async id => {
  const url = `${base_url}/teachers/${id}/info`
  try {
    return await attemptGetFor(url)
  } catch (e) {
    console.log('GET TCHR FIAIELd', id)
    throw e
  }
}

const getCourseTypeCodes = async () => {
  const url = `${base_url}/codes/learningopportunities/types`
  try {
    return await attemptGetFor(url)
  } catch (e) {
    console.log('CORUSE TTYPE CODE FAIEL')
    throw e
  }
}

const getLearningOpportunity = async id => {
  const url = `${base_url}/learningopportunities/${id}`
  try {
    return await attemptGetFor(url)
  } catch (e) {
    console.log('GET LEARNIGN OEPPRITUNCITY FAIELD', id)
    throw e
  }
}

const getStudyattainmentStatusCodes = async () => {
  const url = `${base_url}/codes/studyattainments/statuses`
  return await attemptGetFor(url)
}

const getCourseDisciplines = async () => {
  const url = `${base_url}/codes/learningopportunities/disciplines`
  try {
    return await attemptGetFor(url)
  } catch (e) {
    console.log(' GET COURS EDISCIIPLINES FIALED')
    throw e
  }
}
const getSemesters = async () => {
  const url = `${base_url}/codes/semesters`
  try {
    return await attemptGetFor(url)
  } catch (e) {
    console.log('GET SEMESTERS FAIELD')
    throw e
  }
}

const getSemesterEnrollments = async studentnumber => {
  const url = `${base_url}/students/${studentnumber}/semesterenrollments`
  try {
    return await attemptGetFor(url)
  } catch (e) {
    console.log('GEST EMESTER ENROLLMENTS FAIELD')
    throw e
  }
}

const getCourseEnrollments = async studentnumber => {
  const url = `${base_url}/students/${studentnumber}/enrollments`
  try {
    return await attemptGetFor(url)
  } catch (e) {
    console.log('GET COURS EENREOLMETNS FAIELD')
    throw e
  }
}

const getCourseRealisationTypes = async () => {
  const url = `${base_url}/codes/courseunitrealisations/types`
  try {
    return await attemptGetFor(url)
  } catch (e) {
    console.log('GET COURSE REALSITASITON TYPES')
    throw e
  }
}

const courseUnitRealisationsSince = async sinceDate => {
  const url = `${base_url}/courseunitrealisations/changes/ids/${sinceDate}`
  try {
    return await attemptGetFor(url)
  } catch (e) {
    console.log('COURSEU UNTI REALISTIATION')
    throw e
  }
}

const learningOpportunitiesSince = async (sinceDate = '0000-01-01') => {
  const url = `${base_url}/learningopportunities/changes/ids/${sinceDate}`
  try {
    return await attemptGetFor(url)
  } catch (e) {
    console.log('LRNG OPRRTN SINCE')
    throw e
  }
}

const getCourseUnitRealisation = async id => {
  const url = `${base_url}/courseunitrealisations/${id}`
  try {
    return await attemptGetFor(url)
  } catch (e) {
    console.log('GET COURS EUNTI GREALSISTAITOn', id)
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
