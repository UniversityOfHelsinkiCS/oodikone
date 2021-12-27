const { mean } = require('lodash')

// Helper functions
const formatStudyright = studyright => {
  const { studyrightid, studystartdate, enddate, graduated, prioritycode, extentcode, student } = studyright
  return {
    studyrightid,
    studystartdate,
    enddate,
    graduated,
    prioritycode,
    extentcode,
    studentnumber: student.studentnumber,
  }
}

const formatStudent = student => {
  const { studentnumber, gender_code, home_country_en } = student
  return {
    studentnumber,
    gender_code,
    home_country_en,
  }
}

const getYearsArray = (since, isAcademicYear) => {
  const years = []
  for (let i = since; i <= new Date().getFullYear(); i++) {
    const year = isAcademicYear ? `${i} - ${i + 1}` : i
    years.push(year)
  }
  return years
}

const getYearsObject = (years, emptyArrays = false) => {
  let yearsObject = {}
  for (const year of years) {
    yearsObject = { ...yearsObject, [year]: emptyArrays ? [] : 0 }
  }
  return yearsObject
}

const getStatsBasis = years => {
  return {
    graphStats: new Array(years.length).fill(0),
    tableStats: getYearsObject(years),
  }
}

const isMajorStudentCredit = (studyright, attainment_date) =>
  studyright &&
  (studyright.prioritycode === 1 || studyright.prioritycode === 30) && // Is studyright state = MAIN or state = GRADUATED
  studyright.studystartdate <= attainment_date && // Has the credit been attained after studying in the programme started
  studyright.enddate >= attainment_date && // Has the credit been attained before the studyright ended
  (!studyright.canceldate || studyright.canceldate >= attainment_date) // If the studyright was cancelled, was the credit attained before it was cancelled

const getMedian = values => {
  if (values.length === 0) return 0
  values.sort((a, b) => a - b)
  const half = Math.floor(values.length / 2)
  if (values.length % 2) return values[half]
  return (values[half - 1] + values[half]) / 2.0
}

const getMean = values => {
  if (values.length === 0) return 0
  return Math.round(mean(values))
}

const defineYear = (date, isAcademicYear) => {
  if (!date) return ''
  const year = date.getFullYear()
  if (!isAcademicYear) return year
  if (date < new Date(`${year}-07-31`)) return `${year - 1} - ${year}`
  return `${year} - ${year + 1}`
}

const getStartDate = (studyprogramme, isAcademicYear) => {
  if ((studyprogramme.includes('KH') || studyprogramme.includes('MH')) && isAcademicYear) return new Date('2017-08-01')
  if (studyprogramme.includes('KH') || studyprogramme.includes('MH')) return new Date('2017-01-01')
  if (isAcademicYear) return new Date('2000-08-01')
  return new Date('2000-01-01')
}

// There are 9 course_unit_types
// 1. urn:code:course-unit-type:regular
// 2. urn:code:course-unit-type:bachelors-thesis
// 3. urn:code:course-unit-type:masters-thesis
// 4. urn:code:course-unit-type:doctors-thesis
// 5. urn:code:course-unit-type:licentiate-thesis
// 6. urn:code:course-unit-type:bachelors-maturity-examination
// 7. urn:code:course-unit-type:masters-maturity-examination
// 8. urn:code:course-unit-type:communication-and-linguistic-studies
// 9. urn:code:course-unit-type:practical-training-homeland
// Four of these are thesis types

const getThesisType = studyprogramme => {
  if (studyprogramme.includes('MH') || studyprogramme.includes('ma'))
    return ['urn:code:course-unit-type:masters-thesis']
  if (studyprogramme.includes('KH') || studyprogramme.includes('ba'))
    return ['urn:code:course-unit-type:bachelors-thesis']
  if (/^(T)[0-9]{6}$/.test(studyprogramme))
    return ['urn:code:course-unit-type:doctors-thesis', 'urn:code:course-unit-type:licentiate-thesis']
  return 'thesis-type-not-defined'
}

const getPercentage = (value, total) => {
  if (typeof value !== 'number' || typeof total !== 'number') return 'NA'
  if (total === 0) return 'NA'
  if (value === 0) return '0 %'
  return `${((value / total) * 100).toFixed(1)} %`
}

module.exports = {
  formatStudyright,
  formatStudent,
  getYearsArray,
  getYearsObject,
  getStatsBasis,
  isMajorStudentCredit,
  getMedian,
  getMean,
  defineYear,
  getStartDate,
  getThesisType,
  getPercentage,
}
