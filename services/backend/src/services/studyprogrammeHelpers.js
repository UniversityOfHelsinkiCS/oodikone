const { mean } = require('lodash')
const { studentnumbersWithAllStudyrightElements } = require('./populations')

// Helper functions

const getCorrectStudentnumbers = async ({ codes, startDate, endDate, includeAllSpecials, includeGraduated = true }) => {
  let studentnumbers = []
  const exchangeStudents = includeAllSpecials
  const nondegreeStudents = includeAllSpecials
  const transferredOutStudents = includeAllSpecials
  const transferredToStudents = !includeAllSpecials
  const graduatedStudents = !includeGraduated

  studentnumbers = await studentnumbersWithAllStudyrightElements(
    codes,
    startDate,
    endDate,
    exchangeStudents,
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

const resolveStudyRightCode = studyright_elements => {
  if (!studyright_elements) return null
  const studyRightElement = studyright_elements
    .filter(sre => sre.element_detail.type === 20)
    .sort((a, b) => new Date(b.startdate) - new Date(a.startdate))[0]
  if (studyRightElement) return studyRightElement.code
  return null
}

const formatStudyright = studyright => {
  const {
    studyrightid,
    studystartdate,
    enddate,
    givendate,
    graduated,
    active,
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
    graduated,
    active,
    prioritycode,
    extentcode,
    studentnumber: student.studentnumber,
    code: resolveStudyRightCode(studyright_elements),
    studyrightElements: studyright_elements,
    name:
      studyright_elements?.length && studyright_elements[0].element_detail && studyright_elements[0].element_detail.name
        ? studyright_elements[0].element_detail.name
        : null,
  }
}

const formatStudent = student => {
  const { studentnumber, gender_code, home_country_en, creditcount, credits } = student
  return {
    studentnumber,
    gender_code,
    home_country_en,
    creditcount,
    credits,
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
  const allYears = 'Total'
  if (yearsCombined) years.push(allYears)
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

const isMajorStudentCredit = (studyrights, attainment_date, code) =>
  studyrights.some(studyright => {
    if (!studyright) return false
    if (studyright.code !== code) return false
    if (!studyright.graduated) return new Date(attainment_date) >= new Date(studyright.studystartdate)
    return (
      new Date(attainment_date) >= new Date(studyright.studystartdate) &&
      new Date(attainment_date) <= new Date(studyright.enddate)
    )
  })

const isNonMajorCredit = (studyrights, attainment_date) =>
  studyrights.some(studyright => {
    if (!studyright) return false
    if (!studyright.graduated) return new Date(attainment_date) >= new Date(studyright.studystartdate)
    return (
      new Date(attainment_date) >= new Date(studyright.studystartdate) &&
      new Date(attainment_date) <= new Date(studyright.enddate)
    )
  })

const isSpecialGroupCredit = (studyrights, attainment_date, transfers) =>
  studyrights.some(studyright => {
    if (!studyright) return true // If there is no studyright matching the credit, is not a major student credit
    if (studyright.studystartdate > attainment_date) return true // Credits before the studyright started are not major student credits
    if (studyright.enddate && attainment_date > studyright.enddate) return true // Credits after studyright are not major student credits
    if ([7, 9, 16, 34, 22, 99, 14, 13].includes(studyright.extentcode)) return true // Excludes non-degree studyrights and exchange students
    if (transfers.includes(studyright.studyrightid)) return true // Excludes both transfers in and out of the programme
    return false
  })

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

const alltimeStartDate = new Date('1900-01-01')
const alltimeEndDate = new Date()

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
  return ['urn:code:course-unit-type:doctors-thesis', 'urn:code:course-unit-type:licentiate-thesis']
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
  lte180: {
    name: '150-179 credits',
    data: getEmptyArray(years.length),
  },
  mte180: {
    name: 'More than 180 credits',
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
  lte300: {
    name: '280-299 credits',
    data: getEmptyArray(years.length),
  },
  mte300: {
    name: 'More than 300 credits',
    data: getEmptyArray(years.length),
  },
})

const getDoctoralCreditGraphStats = years => ({
  lte50: {
    name: 'Less than 50 credits',
    data: getEmptyArray(years.length),
  },
  lte100: {
    name: '50-99 credits',
    data: getEmptyArray(years.length),
  },
  lte150: {
    name: '100-149 credits',
    data: getEmptyArray(years.length),
  },
  lte200: {
    name: '150-199 credits',
    data: getEmptyArray(years.length),
  },
  lte250: {
    name: '200-249 credits',
    data: getEmptyArray(years.length),
  },
  lte300: {
    name: '250-299 credits',
    data: getEmptyArray(years.length),
  },
  mte300: {
    name: 'More than 300 credits',
    data: getEmptyArray(years.length),
  },
})

const getCreditGraphStats = (studyprogramme, years) => {
  if (studyprogramme.includes('KH')) return getBachelorCreditGraphStats(years)
  if (studyprogramme.includes('MH')) return getMasterCreditGraphStats(years)
  return getDoctoralCreditGraphStats(years)
}

const bachelorCreditThresholds = ['lte30', 'lte60', 'lte90', 'lte120', 'lte150', 'lte180', 'mte180']
const masterCreditThresholds = ['lte200', 'lte220', 'lte240', 'lte260', 'lte280', 'lte300', 'mte300']
const doctoralCreditThresholds = ['lte50', 'lte100', 'lte150', 'lte200', 'lte250', 'lte300', 'mte300']
const bachelorCreditAmounts = [30, 60, 90, 120, 150, 180, 180]
const masterCreditAmounts = [200, 220, 240, 260, 280, 300, 300]
const doctoralCreditAmounts = [50, 100, 150, 200, 250, 300, 300]

const getCreditThresholds = studyprogramme => {
  if (studyprogramme.includes('KH')) {
    return { creditThresholdKeys: bachelorCreditThresholds, creditThresholdAmounts: bachelorCreditAmounts }
  }
  if (studyprogramme.includes('MH')) {
    return { creditThresholdKeys: masterCreditThresholds, creditThresholdAmounts: masterCreditAmounts }
  }
  return { creditThresholdKeys: doctoralCreditThresholds, creditThresholdAmounts: doctoralCreditAmounts }
}

const tableTitles = {
  basics: {
    SPECIAL_EXCLUDED: ['', 'Started studying', 'Graduated'],
    SPECIAL_INCLUDED: ['', 'Started studying', 'Graduated', 'Transferred away', 'Transferred to'],
  },
  credits: {
    SPECIAL_EXCLUDED: ['', 'Total', 'Major students credits', 'Transferred credits'],
    SPECIAL_INCLUDED: [
      '',
      'Total',
      'Major students credits',
      'Non-major students credits',
      'Non-degree students credits',
      'Transferred credits',
    ],
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
      '150-179 credits',
      '> 180 credits',
    ],
    master: [
      '',
      'All',
      '< 200 credits',
      '200-219 credits',
      '220-239 credits',
      '240-259 credits',
      '260-279 credits',
      '280-299 credits',
      '> 300 credits',
    ],
    doctoral: [
      '',
      'All',
      '< 50 credits',
      '50-99 credits',
      '100-149 credits',
      '150-199 credits',
      '200-249 credits',
      '250-299 credits',
      '> 300 credits',
    ],
  },
  studytracks: [
    '',
    'All',
    'Started studying',
    'Currently enrolled',
    'Absent',
    'Inactive',
    'Graduated',
    'Men',
    'Women',
    'Finnish',
  ],
}

const getCreditProgressTableTitles = studyprogramme => {
  if (studyprogramme.includes('KH')) return tableTitles.creditProgress.bachelor
  if (studyprogramme.includes('MH')) return tableTitles.creditProgress.master
  return tableTitles.creditProgress.doctoral
}

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
  alltimeStartDate,
  alltimeEndDate,
  getThesisType,
  getPercentage,
  getBachelorCreditGraphStats,
  getMasterCreditGraphStats,
  getDoctoralCreditGraphStats,
  getCreditGraphStats,
  getCreditThresholds,
  tableTitles,
  getCreditProgressTableTitles,
  isNonMajorCredit,
}
