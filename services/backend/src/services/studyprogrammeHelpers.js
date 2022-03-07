const { mean } = require('lodash')
const { studentnumbersWithAllStudyrightElements } = require('./populations')

// Helper functions

const getCorrectStudentnumbers = async ({ codes, startDate, endDate, includeAllSpecials, includeGraduated = true }) => {
  let studentnumbers = []
  const exchangeStudents = includeAllSpecials
  const cancelledStudents = includeAllSpecials
  const nondegreeStudents = includeAllSpecials
  const transferredOutStudents = includeAllSpecials
  const transferredToStudents = !includeAllSpecials
  const graduatedStudents = !includeGraduated

  studentnumbers = await studentnumbersWithAllStudyrightElements(
    codes,
    startDate,
    endDate,
    exchangeStudents,
    cancelledStudents,
    nondegreeStudents,
    transferredOutStudents,
    null,
    transferredToStudents,
    graduatedStudents
  )

  return studentnumbers
}

const defineStartDate = (studyright_elements, studystartdate) => {
  if (studyright_elements?.length && studyright_elements[0].startdate > studystartdate) {
    return studyright_elements[0].startdate
  }
  return studystartdate
}

const formatStudyright = studyright => {
  const {
    studyrightid,
    studystartdate,
    enddate,
    givendate,
    canceldate,
    graduated,
    prioritycode,
    extentcode,
    student,
    studyright_elements,
  } = studyright

  return {
    studyrightid,
    studystartdate: defineStartDate(studyright_elements, studystartdate),
    enddate,
    givendate,
    canceldate,
    graduated,
    prioritycode,
    extentcode,
    studentnumber: student.studentnumber,
    code: studyright_elements?.length ? studyright_elements[0].code : null,
    name:
      studyright_elements?.length && studyright_elements[0].element_detail && studyright_elements[0].element_detail.name
        ? studyright_elements[0].element_detail.name
        : null,
  }
}

const formatStudent = student => {
  const { studentnumber, gender_code, home_country_en, creditcount } = student
  return {
    studentnumber,
    gender_code,
    home_country_en,
    creditcount,
  }
}

const formatTransfer = transfer => {
  const { sourcecode, targetcode, transferdate, studyrightid } = transfer
  return {
    sourcecode,
    targetcode,
    transferdate,
    studyrightid,
  }
}

const getYearsArray = (since, isAcademicYear, yearsCombined) => {
  const years = []
  if (yearsCombined) return [`${since} - ${new Date().getFullYear()}`]
  for (let i = since; i <= new Date().getFullYear(); i++) {
    const year = isAcademicYear ? `${i} - ${i + 1}` : i
    years.push(year)
  }
  return years
}

const getYearsObject = ({ years, emptyArrays = false }) => {
  let yearsObject = {}
  for (const year of years) {
    yearsObject = { ...yearsObject, [year]: emptyArrays ? [] : 0 }
  }
  return yearsObject
}

const getAcademicYearsObject = ({ years, emptyArrays = false }) => {
  let yearsObject = {}
  for (const year of years) {
    yearsObject = { ...yearsObject, [`${year} - ${year + 1}`]: emptyArrays ? [] : 0 }
  }
  return yearsObject
}

const getStatsBasis = years => {
  return {
    graphStats: new Array(years.length).fill(0),
    tableStats: getYearsObject({ years }),
  }
}

const isMajorStudentCredit = (studyright, attainment_date) =>
  studyright &&
  (studyright.prioritycode === 1 || studyright.prioritycode === 30) && // Is studyright state = MAIN or state = GRADUATED
  studyright.studystartdate && // The student has started studying in the programme
  studyright.studystartdate <= attainment_date && // Has the credit been attained after studying in the programme started
  studyright.enddate >= attainment_date && // Has the credit been attained before the studyright ended
  (!studyright.canceldate || studyright.canceldate >= attainment_date) // If the studyright was cancelled, was the credit attained before it was cancelled

const isSpecialGroupCredit = (studyright, attainment_date, transfers) => {
  if (!studyright) return true // If there is no studyright matching the credit, is not a major student credit
  if (studyright.canceldate) return true // Cancelled studyrights are in the special groups
  if (studyright.studystartdate > attainment_date) return true // Credits before the studyright started are not major student credits
  if (studyright.enddate && attainment_date > studyright.enddate) return true // Credits after studyright are not major student credits
  if ([7, 9, 16, 34, 33, 99, 14, 13].includes(studyright.extentcode)) return true // Excludes non-degree studyrights and exchange students
  if (transfers.includes(studyright.studyrightid)) return true // Excludes both transfers in and out of the programme
  return false
}

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
  if (isAcademicYear) return new Date('2017-08-01')
  return new Date('2017-01-01')
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

const getEmptyArray = length => new Array(length).fill(0)

const getBachelorCreditGraphStats = years => ({
  lte30: {
    name: 'Less than 30 credits',
    data: getEmptyArray(years.length),
  },
  lte60: {
    name: '30-59 credits',
    data: getEmptyArray(years.length),
  },
  lte90: {
    name: '60-89 credits',
    data: getEmptyArray(years.length),
  },
  lte120: {
    name: '90-119 credits',
    data: getEmptyArray(years.length),
  },
  lte150: {
    name: '120-149 credits',
    data: getEmptyArray(years.length),
  },
  mte150: {
    name: 'More than 150 credits',
    data: getEmptyArray(years.length),
  },
})

const getMasterCreditGraphStats = years => ({
  lte200: {
    name: 'Less than 200 credits',
    data: getEmptyArray(years.length),
  },
  lte220: {
    name: '200-219 credits',
    data: getEmptyArray(years.length),
  },
  lte240: {
    name: '220-239 credits',
    data: getEmptyArray(years.length),
  },
  lte260: {
    name: '240-259 credits',
    data: getEmptyArray(years.length),
  },
  lte280: {
    name: '260-279 credits',
    data: getEmptyArray(years.length),
  },
  mte280: {
    name: 'More than 280 credits',
    data: getEmptyArray(years.length),
  },
})

const getCreditGraphStats = (studyprogramme, years) =>
  studyprogramme.includes('KH') ? getBachelorCreditGraphStats(years) : getMasterCreditGraphStats(years)

const bachelorCreditThresholds = ['lte30', 'lte60', 'lte90', 'lte120', 'lte150', 'mte150']
const masterCreditThresholds = ['lte200', 'lte220', 'lte240', 'lte260', 'lte280', 'mte280']
const bachelorCreditAmounts = [30, 60, 90, 120, 150, 150]
const masterCreditAmounts = [200, 220, 240, 260, 280, 280]

const getCreditThresholds = studyprogramme => {
  if (studyprogramme.includes('KH')) {
    return { creditThresholdKeys: bachelorCreditThresholds, creditThresholdAmounts: bachelorCreditAmounts }
  }
  return { creditThresholdKeys: masterCreditThresholds, creditThresholdAmounts: masterCreditAmounts }
}

const tableTitles = {
  basics: {
    SPECIAL_EXCLUDED: ['', 'Started studying', 'Graduated'],
    SPECIAL_INCLUDED: ['', 'Started studying', 'Graduated', 'Cancelled', 'Transferred away', 'Transferred to'],
  },
  credits: {
    SPECIAL_EXCLUDED: ['', 'Total', 'Major students credits', 'Transferred credits'],
    SPECIAL_INCLUDED: ['', 'Total', 'Major students credits', 'Non major students credits', 'Transferred credits'],
  },
  creditProgress: {
    bachelor: [
      '',
      'All',
      '< 30 credits',
      '30-59 credits',
      '60-89 credits',
      '90-119 credits',
      '120-149 credits',
      '> 150 credits',
    ],
    master: [
      '',
      'All',
      '< 200 credits',
      '200-219 credits',
      '220-239 credits',
      '240-259 credits',
      '260-279 credits',
      '> 280 credits',
    ],
  },
  studytracks: [
    '',
    'All',
    'Started studying',
    'Currently enrolled',
    'Absent',
    'Cancelled',
    'Graduated',
    'Men',
    'Women',
    'Finnish',
  ],
}

const getCreditProgressTableTitles = studyprogramme =>
  studyprogramme.includes('KH') ? tableTitles.bachelorCreditProgress : tableTitles.masterCreditProgress

module.exports = {
  getCorrectStudentnumbers,
  formatStudyright,
  formatStudent,
  formatTransfer,
  getYearsArray,
  getYearsObject,
  getAcademicYearsObject,
  getStatsBasis,
  isMajorStudentCredit,
  isSpecialGroupCredit,
  getMedian,
  getMean,
  defineYear,
  getStartDate,
  getThesisType,
  getPercentage,
  getBachelorCreditGraphStats,
  getMasterCreditGraphStats,
  getCreditGraphStats,
  getCreditThresholds,
  tableTitles,
  getCreditProgressTableTitles,
}
