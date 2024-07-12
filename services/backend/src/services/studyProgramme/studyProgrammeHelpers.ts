import { orderBy } from 'lodash'

import { codes } from '../../../config/programmeCodes'
import { ElementDetailType } from '../../types/elementDetailType'
import { ExtentCode } from '../../types/extentCode'
import { studentnumbersWithAllStudyrightElements } from '../populations'

export const getCorrectStudentnumbers = async ({
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

const resolveStudyRightCode = (studyRightElements: any[]) => {
  if (!studyRightElements) {
    return null
  }
  const studyRightElement = studyRightElements
    .filter(element => element.element_detail.type === ElementDetailType.PROGRAMME)
    .sort((a, b) => new Date(b.startdate).getTime() - new Date(a.startdate).getTime())[0]
  if (!studyRightElement) {
    return null
  }
  return studyRightElement.code
}

export const formatStudyright = studyright => {
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

export const formatStudent = student => {
  const { studentnumber, gender_code, home_country_en, creditcount, credits } = student
  return {
    studentNumber: studentnumber,
    genderCode: gender_code,
    homeCountryEn: home_country_en,
    creditcount,
    credits,
  }
}

export const formatCredit = credit => {
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

export const formatTransfer = transfer => {
  return {
    sourcecode: transfer.sourcecode,
    targetcode: transfer.targetcode,
    transferdate: transfer.transferdate,
    studyrightid: transfer.studyrightid,
  }
}

export const getYearsArray = (since, isAcademicYear, yearsCombined) => {
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

export const getYearsObject = ({ years, emptyArrays = false }) => {
  let yearsObject = {}
  for (const year of years) {
    yearsObject = { ...yearsObject, [year]: emptyArrays ? [] : 0 }
  }
  return yearsObject
}

export const getStatsBasis = years => {
  return {
    graphStats: new Array(years.length).fill(0),
    tableStats: getYearsObject({ years }),
  }
}

export const getCorrectStartDate = studyRight => {
  return studyRight.studyrightid.slice(-2) === '-2' && studyRight.extentcode === ExtentCode.MASTER
    ? studyRight.studystartdate
    : studyRight.startdate
}

export const getMedian = (values: number[]): number => {
  if (values.length === 0) {
    return 0
  }
  values.sort((a, b) => a - b)
  const half = Math.floor(values.length / 2)
  if (values.length % 2) {
    return values[half]
  }
  return (values[half - 1] + values[half]) / 2.0
}

export const defineYear = (date: Date, isAcademicYear: boolean): number | string => {
  if (!date) {
    return ''
  }
  const year = date.getFullYear()
  if (!isAcademicYear) {
    return year
  }
  // Some dates are given in utc time in database, some not.
  if (new Date(date).toISOString() < new Date(`${year}-07-31T21:00:00.000Z`).toISOString()) {
    return `${year - 1} - ${year}`
  }
  return `${year} - ${year + 1}`
}

export const getStartDate = (isAcademicYear: boolean): Date => {
  return isAcademicYear ? new Date('2017-08-01') : new Date('2017-01-01')
}

export const alltimeStartDate = new Date('1900-01-01')
export const alltimeEndDate = new Date()

// In the object programmes should be {bachelorCode: masterCode}
export const combinedStudyprogrammes = { KH90_001: 'MH90_001' }

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

export const getThesisType = (studyProgramme: string): string[] => {
  if (studyProgramme.includes('MH') || studyProgramme.includes('ma')) {
    return ['urn:code:course-unit-type:masters-thesis']
  }
  if (studyProgramme.includes('KH') || studyProgramme.includes('ba')) {
    return ['urn:code:course-unit-type:bachelors-thesis']
  }
  if (/^(T)[0-9]{6}$/.test(studyProgramme)) {
    return ['urn:code:course-unit-type:doctors-thesis', 'urn:code:course-unit-type:licentiate-thesis']
  }
  return ['urn:code:course-unit-type:doctors-thesis', 'urn:code:course-unit-type:licentiate-thesis']
}

export const getPercentage = (value: number, total: number): string => {
  if (typeof value !== 'number' || typeof total !== 'number') return 'NA'
  if (total === 0) return 'NA'
  if (value === 0) return '0 %'
  return `${((value / total) * 100).toFixed(1)} %`
}

export const getCreditThresholds = (): Record<string, Array<number | string>> => {
  // Only doctoral and licentiate study programmes (40 study credits) use this as of September 2023
  return {
    creditThresholdKeys: ['lte10', 'lte20', 'lte30', 'lte40', 'mte40'],
    creditThresholdAmounts: [10, 20, 30, 40, 40],
  }
}

export const tableTitles = {
  basics: {
    SPECIAL_EXCLUDED: ['', 'Started studying', 'Accepted', 'Graduated'],
    SPECIAL_INCLUDED: ['', 'Started studying', 'Accepted', 'Graduated', 'Transferred away', 'Transferred to'],
    SPECIAL_EXCLUDED_COMBINED_PROGRAMME: [
      '',
      'Started studying bachelor',
      'Started studying licentiate',
      'Accepted bachelor',
      'Accepted licentiate',
      'Graduated bachelor',
      'Graduated licentiate',
    ],
    SPECIAL_INCLUDED_COMBINED_PROGRAMME: [
      '',
      'Started studying bachelor',
      'Started studying licentiate',
      'Accepted bachelor',
      'Accepted licentiate',
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

export const mapCodesToIds = data => {
  // Add programme id e.g. TKT
  const keys = Object.keys(codes)
  const progs = Object.keys(data)

  for (const prog of progs) {
    if (keys.includes(prog)) {
      data[prog].progId = codes[prog]
    }
  }
}

export const getId = (code: string): string => codes[code] ?? ''

export const getGoal = programme => {
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

export const isRelevantProgramme = code => {
  return (
    (code.includes('KH') && !code.startsWith('2_KH') && !code.endsWith('_2')) ||
    (code.includes('MH') && !code.startsWith('2_MH') && !code.endsWith('_2')) ||
    /^(T)[0-9]{6}$/.test(code)
  )
}

export const getStudyRightElementsWithPhase = (studyRight, phase) => {
  return orderBy(
    studyRight.studyRightElements.filter(sre => sre.phase === phase),
    ['startDate'],
    ['asc']
  )
}
