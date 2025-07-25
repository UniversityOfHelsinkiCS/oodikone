import { each } from 'async'

import { selectAllFrom, selectAllFromSnapshots } from '../db/index.js'
import { Semester, Organization, CREDIT_TYPE_CODES } from '../db/models/index.js'
import { redisClient, lock as redisLock } from '../utils/redis.js'

const getRedisJSON = async key => JSON.parse(await redisClient.get(key))
const setRedisJSON = async (key, value) => redisClient.set(key, JSON.stringify(value))

const TIME_LIMIT_BETWEEN_RELOADS = 1000 * 60 * 30
const REDIS_INITIALIZED = 'INITIALIZED'
const SHARED_LOCK = 'SHARED_LOCK'
const FIRST_SEMESTER_START_YEAR = 1950

let loadedAt = null

const localMapToRedisKey = {
  daysToSemesters: 'DAYS_TO_SEMESTERS',
  educationTypes: 'EDUCATION_TYPES',
  organisationIdToCode: 'ORGANISATION_ID_TO_CODE',
  educationIdToEducation: 'EDUCATION_ID_TO_EDUCATION',
  gradeScaleIdToGradeIdsToGrades: 'GRADE_SCALE_ID_TO_GRADE_SCALE_IDS_TO_GRADES',
  orgToUniOrgId: 'ORG_TO_UNI_ORG_ID',
  startYearToSemesters: 'START_YEAR_TO_SEMESTERS',
  countries: 'COUNTRIES',
}

const localMaps = {
  daysToSemesters: null,
  educationTypes: null,
  organisationIdToCode: null,
  educationIdToEducation: null,
  gradeScaleIdToGradeIdsToGrades: null,
  orgToUniOrgId: null,
  startYearToSemesters: null,
  countries: null,
}

const loadMapsFromRedis = async () =>
  each(Object.entries(localMapToRedisKey), async ([localMap, redisKey]) => {
    localMaps[localMap] = await getRedisJSON(redisKey)
  })

const initDaysToSemesters = async () => {
  const semesters = await Semester.findAll()
  await setRedisJSON(
    localMapToRedisKey.daysToSemesters,
    semesters.reduce((res, curr) => {
      const start = new Date(curr.startdate).getTime()
      const end = new Date(curr.enddate).getTime() - 1

      for (let i = start; i < end; i += 1000 * 60 * 60 * 24) {
        const newDay = new Date(i)
        res[newDay.toDateString()] = {
          semestercode: curr.semestercode,
          composite: curr.composite,
        }
      }
      return res
    }, {})
  )
}

export const getSemesterByDate = date => localMaps.daysToSemesters[date.toDateString()]

const initEducationTypes = async () =>
  setRedisJSON(
    localMapToRedisKey.educationTypes,
    (await selectAllFrom('education_types')).reduce((acc, curr) => {
      acc[curr.id] = curr
      return acc
    }, {})
  )

export const getEducationType = id => localMaps.educationTypes[id]

const initOrganisationIdToCode = async () =>
  setRedisJSON(
    localMapToRedisKey.organisationIdToCode,
    (await Organization.findAll()).reduce((acc, curr) => {
      acc[curr.id] = curr.code
      return acc
    }, {})
  )

export const getOrganisationCode = id => localMaps.organisationIdToCode[id]

const initEducationIdToEducation = async () =>
  setRedisJSON(
    localMapToRedisKey.educationIdToEducation,
    (await selectAllFrom('educations')).reduce((acc, curr) => {
      acc[curr.id] = curr
      return acc
    }, {})
  )

export const getEducation = id => localMaps.educationIdToEducation[id]

const initGradeScaleIdToGradeIdsToGrades = async () =>
  setRedisJSON(
    localMapToRedisKey.gradeScaleIdToGradeIdsToGrades,
    (await selectAllFrom('grade_scales')).reduce((res, curr) => {
      res[curr.id] = curr.grades.reduce((res, curr) => {
        const { localId, numericCorrespondence, passed, abbreviation } = curr
        const { fi, en, sv } = abbreviation || {}
        const abbr = fi || en || sv || 'Unknown'
        if (!res[localId])
          res[localId] = {
            value: numericCorrespondence || abbr,
            passed,
          }
        return res
      }, {})
      return res
    }, {})
  )

export const getGrade = (scaleId, gradeId) => localMaps.gradeScaleIdToGradeIdsToGrades[scaleId][gradeId]

const initOrgToUniOrgId = async () => {
  const organisations = await selectAllFromSnapshots('organisations')
  await setRedisJSON(
    localMapToRedisKey.orgToUniOrgId,
    organisations.reduce((res, curr) => {
      res[curr.id] = curr.university_org_id
      return res
    }, {})
  )
}

export const getUniOrgId = orgId => localMaps.orgToUniOrgId[orgId]

const initStartYearToSemesters = async () =>
  setRedisJSON(
    localMapToRedisKey.startYearToSemesters,
    (await Semester.findAll()).reduce((res, curr) => {
      if (!res[curr.startYear]) {
        res[curr.startYear] = {}
        if (curr.startYear === FIRST_SEMESTER_START_YEAR) {
          for (let i = 1900; i < FIRST_SEMESTER_START_YEAR; i++) {
            res[i] = { 0: curr, 1: curr }
          }
        }
      }
      res[curr.startYear][curr.termIndex] = curr
      return res
    }, {})
  )

export const getSemester = (studyYearStartYear, termIndex) => {
  return localMaps.startYearToSemesters[studyYearStartYear][termIndex]
}

const initCountries = async () =>
  setRedisJSON(
    localMapToRedisKey.countries,
    (await selectAllFrom('countries')).reduce((res, curr) => {
      if (!res[curr.id]) res[curr.id] = curr
      return res
    }, {})
  )

const calculateMapsToRedis = async () =>
  Promise.all([
    initDaysToSemesters(),
    initEducationTypes(),
    initOrganisationIdToCode(),
    initEducationIdToEducation(),
    initGradeScaleIdToGradeIdsToGrades(),
    initOrgToUniOrgId(),
    initStartYearToSemesters(),
    initCountries(),
  ])

export const loadMapsIfNeeded = async () => {
  const now = new Date().getTime()
  if (!loadedAt || now - loadedAt > TIME_LIMIT_BETWEEN_RELOADS) {
    const unlock = await redisLock(SHARED_LOCK, 1000 * 60 * 3)
    const isInitialized = await redisClient.get(REDIS_INITIALIZED)
    if (!isInitialized) {
      await calculateMapsToRedis()
      // Expire the key after 1800 seconds (30 minutes)
      await redisClient.set(REDIS_INITIALIZED, 'true', { EX: 1800 })
    }
    await unlock()
    await loadMapsFromRedis()
    loadedAt = now
  }
}

export const loadMapsOnDemand = async () => {
  // TODO: hotfix for frontend, refactor this to more logical place
  const unlock = await redisLock(SHARED_LOCK, 1000 * 60 * 3)
  await calculateMapsToRedis()
  await redisClient.set(REDIS_INITIALIZED, 'true', { EX: 1800 })
  await unlock()
  await loadMapsFromRedis()
  loadedAt = new Date().getTime()
}

export const getCountry = countryId => localMaps.countries[countryId]

export const educationTypeToExtentcode = {
  'urn:code:education-type:degree-education:bachelors-degree': 1,
  'urn:code:education-type:degree-education:masters-degree': 2,
  'urn:code:education-type:degree-education:lic': 3,
  'urn:code:education-type:degree-education:doctor': 4,
  'urn:code:education-type:degree-education:bachelors-and-masters-degree': 5,
  'urn:code:education-type:non-degree-education:updating-training': 6,
  'urn:code:education-type:non-degree-education:exchange-studies': 7,
  'urn:code:education-type:non-degree-education:open-university-studies': 9,
  'urn:code:education-type:non-degree-education:separate-studies:separate-teacher-pedagogical-studies': 13,
  'urn:code:education-type:non-degree-education:agreement-studies': 14,
  'urn:code:education-type:non-degree-education:agreement-studies:bilateral-agreement-studies': null, // Parent is 14
  'urn:code:education-type:non-degree-education:agreement-studies:joo-studies': null, // Parent is 14
  'urn:code:education-type:non-degree-education:agreement-studies:studies-for-secondary-school-students': 16,
  'urn:code:education-type:non-degree-education:separate-studies:specialisation-studies': 18,
  'urn:code:education-type:non-degree-education:separate-studies:separate-special-education-teacher-pedagogical-studies': 22,
  'urn:code:education-type:degree-education:specialisation-in-medicine-and-dentistry': 23,
  'urn:code:education-type:degree-education:specialisation-in-veterinary': 23, // This should be perhaps under own extentcode, but both 23's are mapped into same box as credits are computed.
  'urn:code:education-type:non-degree-education:summer-winter-school': 31,
  'urn:code:education-type:non-degree-education:exchange-studies-postgraduate': 34,
  'urn:code:education-type:non-degree-education:separate-studies': 99,
  'urn:code:education-type:non-degree-education:separate-studies:separate-subject-matter-studies': null, // Parent is 99
  'urn:code:education-type:non-degree-education:separate-studies:alumni-studies': null, // Parent is 99
  'urn:code:education-type:non-degree-education:separate-studies:separate-study-advisor-studies': null, // Parent is 99
  'urn:code:education-type:non-degree-education:separate-studies:separate-personal-studies': null, // Parent is 99
  'urn:code:education-type:non-degree-education:separate-studies:adult-educator-pedagogical-studies': null, // Parent is 99
}

export const getCreditTypeCodeFromAttainment = (attainment, passed) => {
  const { primary, state } = attainment
  if (!passed || state === 'FAILED') return CREDIT_TYPE_CODES.FAILED
  if (!primary) return CREDIT_TYPE_CODES.IMPROVED
  if (state === 'ATTAINED') return CREDIT_TYPE_CODES.PASSED
  return CREDIT_TYPE_CODES.APPROVED
}

const creditTypeIdToCreditType = {
  4: {
    credittypecode: CREDIT_TYPE_CODES.PASSED,
    name: { en: 'Completed', fi: 'Suoritettu', sv: 'Genomförd' },
  },
  7: {
    credittypecode: CREDIT_TYPE_CODES.IMPROVED,
    name: { en: 'Improved (grade)', fi: 'Korotettu', sv: 'Höjd' },
  },
  9: {
    credittypecode: CREDIT_TYPE_CODES.APPROVED,
    name: { en: 'Transferred', fi: 'Hyväksiluettu', sv: 'Tillgodoräknad' },
  },
  10: {
    credittypecode: CREDIT_TYPE_CODES.FAILED,
    name: { en: 'Failed', fi: 'Hylätty', sv: 'Underkänd' },
  },
}

export const creditTypeIdsToCreditTypes = ids => ids.map(id => creditTypeIdToCreditType[id])
