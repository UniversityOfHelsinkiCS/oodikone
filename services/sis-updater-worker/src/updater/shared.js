const { Semester, Organization } = require('../db/models')
const { selectAllFrom, selectAllFromSnapshots } = require('../db')

let mapsInitialized = false
let daysToSemesters = null
let educationTypes = null
let organisationIdToCode = null
let educationIdToEducation = null
let gradeScaleIdToGradeIdsToGrades = null
let orgToUniOrgId = null
let orgToStartYearToSemesters = null

const areMapsInitialized = () => mapsInitialized

const initDaysToSemesters = async () => {
  const semesters = await Semester.findAll()
  daysToSemesters = semesters.reduce((res, curr) => {
    const start = new Date(curr.startdate).getTime()
    const end = new Date(curr.enddate).getTime() - 1

    for (let i = start; i < end; i += 1000 * 60 * 60 * 24) {
      const newDay = new Date(i)
      res[newDay.toDateString()] = {
        semestercode: curr.semestercode,
        composite: curr.composite
      }
    }
    return res
  }, {})
}

const getSemesterByDate = date => {
  if (!daysToSemesters) throw new Error('daysToSemesters null!')
  return daysToSemesters[date.toDateString()]
}

const initEducationTypes = async () => {
  educationTypes = (await selectAllFrom('education_types')).reduce((acc, curr) => {
    acc[curr.id] = curr
    return acc
  }, {})
}

const getEducationType = id => educationTypes[id]

const initOrganisationIdToCode = async () => {
  organisationIdToCode = (await Organization.findAll()).reduce((acc, curr) => {
    acc[curr.id] = curr.code
    return acc
  }, {})
}

const getOrganisationCode = id => organisationIdToCode[id]

const initEducationIdToEducation = async () => {
  educationIdToEducation = (await selectAllFrom('educations')).reduce((acc, curr) => {
    acc[curr.id] = curr
    return acc
  }, {})
}

const getEducation = id => educationIdToEducation[id]

const initGradeScaleIdToGradeIdsToGrades = async () => {
  gradeScaleIdToGradeIdsToGrades = (await selectAllFrom('grade_scales')).reduce((res, curr) => {
    res[curr.id] = curr.grades.reduce((res, curr) => {
      const {
        localId,
        numericCorrespondence,
        passed,
        abbreviation: { fi }
      } = curr
      if (!res[localId])
        res[localId] = {
          value: numericCorrespondence || fi,
          passed
        }
      return res
    }, {})
    return res
  }, {})
}

const getGrade = (scaleId, gradeId) => gradeScaleIdToGradeIdsToGrades[scaleId][gradeId]

const initOrgToUniOrgId = async () => {
  const organisations = await selectAllFromSnapshots('organisations')
  orgToUniOrgId = organisations.reduce((res, curr) => {
    res[curr.id] = curr.university_org_id
    return res
  }, {})
}

const getUniOrgId = orgId => orgToUniOrgId[orgId]

const initOrgToStartYearToSemesters = async () => {
  orgToStartYearToSemesters = (await Semester.findAll()).reduce((res, curr) => {
    if (!res[curr.org]) res[curr.org] = {}
    if (!res[curr.org][curr.startYear]) res[curr.org][curr.startYear] = {}
    res[curr.org][curr.startYear][curr.termIndex] = curr
    return res
  }, {})
}

const getSemester = (uniOrgId, studyYearStartYear, termIndex) =>
  orgToStartYearToSemesters[uniOrgId][studyYearStartYear][termIndex]

const getCreditTypeCodeFromAttainment = (attainment, passed) => {
  const { primary, state } = attainment
  if (!passed || state === 'FAILED') return 10
  if (!primary) return 7
  if (state === 'ATTAINED') return 4
  return 9
}

const educationTypeToExtentcode = {
  'urn:code:education-type:degree-education:bachelors-degree': 1,
  'urn:code:education-type:degree-education:masters-degree': 2,
  'urn:code:education-type:degree-education:lic': 3,
  'urn:code:education-type:degree-education:doctor': 4,
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
  'urn:code:education-type:non-degree-education:summer-winter-school': 31,
  'urn:code:education-type:non-degree-education:exchange-studies-postgraduate': 34,
  'urn:code:education-type:non-degree-education:separate-studies': 99,
  'urn:code:education-type:non-degree-education:separate-studies:separate-subject-matter-studies': null, // Parent is 99
  'urn:code:education-type:non-degree-education:separate-studies:alumni-studies': null, // Parent is 99
  'urn:code:education-type:non-degree-education:separate-studies:separate-study-advisor-studies': null, // Parent is 99
  'urn:code:education-type:non-degree-education:separate-studies:separate-personal-studies': null, // Parent is 99
  'urn:code:education-type:non-degree-education:separate-studies:adult-educator-pedagogical-studies': null // Parent is 99
}

const creditTypeIdToCreditType = {
  4: {
    credittypecode: 4,
    name: { en: 'Completed', fi: 'Suoritettu', sv: 'Genomförd' }
  },
  7: {
    credittypecode: 7,
    name: { en: 'Improved (grade)', fi: 'Korotettu', sv: 'Höjd' }
  },
  9: {
    credittypecode: 9,
    name: { en: 'Transferred', fi: 'Hyväksiluettu', sv: 'Tillgodoräknad' }
  },
  10: {
    credittypecode: 10,
    name: { en: 'Failed', fi: 'Hylätty', sv: 'Underkänd' }
  }
}

const creditTypeIdsToCreditTypes = ids => ids.map(id => creditTypeIdToCreditType[id])

const init = async () => {
  await initDaysToSemesters()
  await initEducationTypes()
  await initOrganisationIdToCode()
  await initEducationIdToEducation()
  await initGradeScaleIdToGradeIdsToGrades()
  await initOrgToUniOrgId()
  await initOrgToStartYearToSemesters()
  mapsInitialized = true
}

module.exports = {
  areMapsInitialized,
  getSemesterByDate,
  getCreditTypeCodeFromAttainment,
  educationTypeToExtentcode,
  creditTypeIdsToCreditTypes,
  getEducationType,
  getOrganisationCode,
  getEducation,
  getGrade,
  getUniOrgId,
  getSemester,
  init
}
