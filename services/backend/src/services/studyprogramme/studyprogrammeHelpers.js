const { studentnumbersWithAllStudyrightElements } = require('../populations')
const { codes } = require('../../../config/programmeCodes')

// Helper functions
const getCorrectStudentnumbers = async ({
  codes,
  startDate,
  endDate,
  includeAllSpecials,
  includeTransferredTo,
  includeGraduated = true,
}) => {
  let studentnumbers = []
  const exchangeStudents = includeAllSpecials
  const nondegreeStudents = includeAllSpecials
  const transferredOutStudents = includeAllSpecials
  const transferredToStudents = includeTransferredTo
  const graduatedStudents = includeGraduated

  studentnumbers = await studentnumbersWithAllStudyrightElements({
    studyRights: codes,
    startDate,
    endDate,
    exchangeStudents,
    nondegreeStudents,
    transferredOutStudents,
    tag: null,
    transferredToStudents,
    graduatedStudents,
  })

  return studentnumbers
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
    startdate,
    studystartdate,
    enddate,
    givendate,
    graduated,
    active,
    prioritycode,
    extentcode,
    student,
    studyright_elements,
    cancelled,
    facultyCode,
    actual_studyrightid,
    semesterEnrollments,
  } = studyright
  return {
    studyrightid,
    startdate,
    studystartdate,
    enddate,
    givendate,
    graduated,
    active,
    prioritycode,
    extentcode,
    studentNumber: student.studentnumber,
    code: resolveStudyRightCode(studyright_elements),
    studyrightElements: studyright_elements,
    cancelled,
    facultyCode,
    actual_studyrightid,
    semesterEnrollments,
    name:
      studyright_elements?.length && studyright_elements[0].element_detail && studyright_elements[0].element_detail.name
        ? studyright_elements[0].element_detail.name
        : null,
  }
}

const formatStudent = student => {
  const { studentnumber, gender_code, home_country_en, creditcount, credits } = student
  return {
    studentNumber: studentnumber,
    genderCode: gender_code,
    homeCountryEn: home_country_en,
    creditcount,
    credits,
  }
}

const formatCredit = credit => {
  const { student_studentnumber, course_code, credits, attainment_date, studyright_id, id, semestercode } = credit
  const code = course_code.replace('AY', '')
  return {
    id: `${student_studentnumber}-${code}`, // For getting unique credits for each course code and student number
    acualId: id,
    studentNumber: student_studentnumber,
    courseCode: code,
    credits,
    attainmentDate: attainment_date,
    studyrightId: studyright_id,
    semestercode,
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
  const today = new Date()
  const until = isAcademicYear && today.getMonth() < 7 ? today.getFullYear() - 1 : today.getFullYear()
  for (let i = since; i <= until; i++) {
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

const getStatsBasis = years => {
  return {
    graphStats: new Array(years.length).fill(0),
    tableStats: getYearsObject({ years }),
  }
}
// Take studystartdate for master students with Bachelor-Master studyright.
const getCorrectStartDate = studyright => {
  return studyright.studyrightid.slice(-2) === '-2' && studyright.extentcode === 2
    ? studyright.studystartdate
    : studyright.startdate
}

const isMajorStudentCredit = (studyrights, attainmentDate, code) =>
  studyrights.some(studyright => {
    if (!studyright) return false
    if (studyright.code !== code) return false
    if ([6, 7, 9, 13, 14, 16, 18, 22, 23, 34, 99].includes(studyright.extentcode)) return false
    const startDate = getCorrectStartDate(studyright)
    if (!studyright.graduated) return new Date(attainmentDate) >= new Date(startDate)
    return new Date(attainmentDate) >= new Date(startDate) && new Date(attainmentDate) <= new Date(studyright.enddate)
  })

const isNonMajorCredit = (studyrights, attainmentDate) => {
  return studyrights.some(studyright => {
    if (!studyright) return false
    if ([6, 7, 9, 13, 14, 16, 18, 22, 23, 34, 99].includes(studyright.extentcode)) return false
    const startDate = getCorrectStartDate(studyright)
    if (!studyright.graduated) return new Date(attainmentDate) >= new Date(startDate)
    return new Date(attainmentDate) >= new Date(startDate) && new Date(attainmentDate) <= new Date(studyright.enddate)
  })
}

const isSpecialGroupCredit = (studyrights, attainment_date, transfers) =>
  studyrights.some(studyright => {
    if (!studyright) return true // If there is no studyright matching the credit, is not a major student credit
    const startDate = getCorrectStartDate(studyright)
    if (new Date(startDate) > new Date(attainment_date)) return true // Credits before the studyright started are not major student credits
    if (studyright.enddate && new Date(attainment_date) > new Date(studyright.enddate)) return true // Credits after studyright are not major student credits
    if ([6, 7, 9, 13, 14, 16, 18, 22, 23, 34, 99].includes(studyright.extentcode)) return true // Excludes non-degree studyrights and exchange students
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

const defineYear = (date, isAcademicYear) => {
  if (!date) return ''
  const year = date.getFullYear()
  if (!isAcademicYear) return year
  // Some dates are given in utc time in database, some not.
  if (new Date(date).toISOString() < new Date(`${year}-07-31T21:00:00.000Z`).toISOString())
    return `${year - 1} - ${year}`
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

// In the object programmes should be {bachelorCode: masterCode}
const combinedStudyprogrammes = { KH90_001: 'MH90_001' }

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

const getCreditThresholds = () => {
  // Only doctoral and licentiate study programmes (40 study credits) use this as of September 2023
  return {
    creditThresholdKeys: ['lte10', 'lte20', 'lte30', 'lte40', 'mte40'],
    creditThresholdAmounts: [10, 20, 30, 40, 40],
  }
}

const tableTitles = {
  basics: {
    SPECIAL_EXCLUDED: ['', 'Started studying', 'Graduated'],
    SPECIAL_INCLUDED: ['', 'Started studying', 'Graduated', 'Transferred away', 'Transferred to'],
    SPECIAL_EXCLUDED_COMBINED_PROGRAMME: [
      '',
      'Started studying bachelor',
      'Started studying licentiate',
      'Graduated bachelor',
      'Graduated licentiate',
    ],
    SPECIAL_INCLUDED_COMBINED_PROGRAMME: [
      '',
      'Started studying bachelor',
      'Started studying licentiate',
      'Graduated bachelor',
      'Graduated licentiate',
      'Transferred away',
      'Transferred to',
    ],
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
  studytracksStart: ['', 'All', 'Started studying', 'Currently enrolled', 'Absent', 'Inactive'],
  studytracksBasic: ['Graduated'],
  studytracksCombined: {
    licentiate: ['Graduated bachelor', 'Graduated licentiate'],
    master: ['Graduated bachelor', 'Graduated master'],
  },
  studytracksEnd: ['Men', 'Women', 'Other/\nUnknown', 'Finland', 'Other'],
}

const mapCodesToIds = data => {
  // Add programme id e.g. TKT
  const keys = Object.keys(codes)
  const progs = Object.keys(data)

  for (const prog of progs) {
    if (keys.includes(prog)) {
      data[prog].progId = codes[prog].toUpperCase()
    }
  }
}

const getId = code => {
  if (Object.keys(codes).includes(code)) {
    return codes[code].toUpperCase()
  }
  return ''
}

const getGoal = programme => {
  if (!programme) return 0
  if (programme.startsWith('KH') || programme.endsWith('-ba')) {
    return 36
  }
  if (programme.startsWith('MH') || programme.endsWith('-ma')) {
    if (programme === 'MH90_001') return 36 // vetenary programme's licentiate is 36 months.
    if (['MH30_004', '420420-ma'].includes(programme)) {
      return 24 + 6
    }
    if (['MH30_001', 'MH30_003', '320011-ma', '320001-ma', '320002-ma'].includes(programme)) {
      return 36 + 24 + 12 // medical, no separate bachelor
    }
    return 24
  }
  if (programme.includes('T')) {
    return 48
  }
  if (programme.startsWith('LI')) {
    return 78
  }
  return 48 // unknown, likely old doctor or licentiate
}

module.exports = {
  getCorrectStudentnumbers,
  formatStudyright,
  formatStudent,
  formatTransfer,
  formatCredit,
  getYearsArray,
  getYearsObject,
  getStatsBasis,
  isMajorStudentCredit,
  isSpecialGroupCredit,
  getMedian,
  defineYear,
  getStartDate,
  alltimeStartDate,
  alltimeEndDate,
  combinedStudyprogrammes,
  getThesisType,
  getPercentage,
  getCreditThresholds,
  tableTitles,
  isNonMajorCredit,
  mapCodesToIds,
  getId,
  getGoal,
  getCorrectStartDate,
}
