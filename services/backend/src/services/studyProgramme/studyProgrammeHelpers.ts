import { orderBy } from 'lodash'
import { InferAttributes } from 'sequelize'

import { serviceProvider } from '../../config'
import { programmeCodes } from '../../config/programmeCodes'
import { SISStudyRight, SISStudyRightElement } from '../../models'
import { Phase } from '../../types'

export function getYearsArray(since: number, isAcademicYear: true, yearsCombined?: boolean): string[]
export function getYearsArray(since: number, isAcademicYear: false, yearsCombined: true): Array<'Total' | number>
export function getYearsArray(since: number, isAcademicYear: false, yearsCombined?: false): number[]
export function getYearsArray(since: number, isAcademicYear: boolean, yearsCombined?: boolean): Array<string | number>
export function getYearsArray(since: number, isAcademicYear: boolean, yearsCombined?: boolean) {
  const years: Array<string | number> = []
  const allYears = 'Total'
  if (yearsCombined) {
    years.push(allYears)
  }
  const today = new Date()
  const until = isAcademicYear && today.getMonth() < 7 ? today.getFullYear() - 1 : today.getFullYear()
  for (let i = since; i <= until; i++) {
    const year = isAcademicYear ? `${i} - ${i + 1}` : i
    years.push(year)
  }
  return years
}

export function getYearsObject(params: { years: Array<string | number>; emptyArrays: true }): Record<string, []>
export function getYearsObject(params: { years: Array<string | number>; emptyArrays?: false }): Record<string, 0>
export function getYearsObject(params: { years: Array<string | number>; emptyArrays?: boolean }) {
  const { years, emptyArrays = false } = params
  return years.reduce<Record<string, 0 | []>>((acc, year) => {
    acc[year] = emptyArrays ? [] : 0
    return acc
  }, {})
}

export const getStatsBasis = (years: Array<string | number>) => {
  return {
    graphStats: new Array<0>(years.length).fill(0),
    tableStats: getYearsObject({ years }),
  }
}

export const getMedian = (values: number[]) => {
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

export function defineYear(date: Date, isAcademicYear: true): string
export function defineYear(date: Date, isAcademicYear: false): number
export function defineYear(date: Date, isAcademicYear: boolean): string | number
export function defineYear(date: Date, isAcademicYear: boolean) {
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

export const getStartDate = (isAcademicYear: boolean) => {
  return isAcademicYear ? new Date('2017-08-01') : new Date('2017-01-01')
}

// In the object programmes should be {bachelorCode: masterCode}
export const combinedStudyprogrammes = { KH90_001: 'MH90_001' } as const

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

export const getThesisType = (studyProgramme: string) => {
  if (studyProgramme.includes('MH') || studyProgramme.includes('ma')) {
    const mastersThesisTypes = ['urn:code:course-unit-type:masters-thesis']
    if (serviceProvider !== 'toska') {
      mastersThesisTypes.push('urn:code:course-unit-type:amk-masters-thesis')
    }
    return mastersThesisTypes
  }

  if (studyProgramme.includes('KH') || studyProgramme.includes('ba')) {
    const bachelorsThesisTypes = ['urn:code:course-unit-type:bachelors-thesis']
    if (serviceProvider !== 'toska') {
      bachelorsThesisTypes.push('urn:code:course-unit-type:amk-bachelors-thesis')
    }
    return bachelorsThesisTypes
  }
  return ['urn:code:course-unit-type:doctors-thesis', 'urn:code:course-unit-type:licentiate-thesis']
}

export const getPercentage = (value: any, total: any) => {
  if (typeof value !== 'number' || typeof total !== 'number') return 'NA'
  if (total === 0) return 'NA'
  if (value === 0) return '0 %'
  return `${((value / total) * 100).toFixed(1)} %`
}

export const getCreditThresholds = () => {
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
  studytracksStart: ['', 'All', 'Started\nstudying', 'Present', 'Absent', 'Inactive'],
  studytracksBasic: ['Graduated'],
  studytracksCombined: {
    licentiate: ['Graduated bachelor', 'Graduated licentiate'],
    master: ['Graduated bachelor', 'Graduated master'],
  },
  studytracksEnd: ['Men', 'Women', 'Other/\nUnknown', 'Finland', 'Other'],
} as const

export const getId = (code: string) =>
  code in programmeCodes ? programmeCodes[code as keyof typeof programmeCodes] : ''

export const getGoal = (programme?: string) => {
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

export const isRelevantProgramme = (code: string) => {
  return (
    (code.includes('KH') && !code.startsWith('2_KH') && !code.endsWith('_2')) ||
    (code.includes('MH') && !code.startsWith('2_MH') && !code.endsWith('_2')) ||
    /^(T)[0-9]{6}$/.test(code)
  )
}

export const getStudyRightElementsWithPhase = (studyRight: InferAttributes<SISStudyRight>, phase: Phase) => {
  return orderBy(
    studyRight.studyRightElements.filter(element => element.phase === phase),
    ['startDate'],
    ['asc']
  )
}

export const hasTransferredFromOrToProgramme = (
  studyRight: InferAttributes<SISStudyRight>,
  studyRightElement: SISStudyRightElement
): [boolean, boolean] => {
  const studyRightElementsWithSamePhase = getStudyRightElementsWithPhase(studyRight, studyRightElement.phase)
  const hasTransferredToProgramme =
    studyRightElementsWithSamePhase[0].code !== studyRightElement.code && studyRightElement.startDate < new Date()
  const hasTransferredFromProgramme =
    studyRightElementsWithSamePhase[studyRightElementsWithSamePhase.length - 1].code !== studyRightElement.code &&
    studyRightElement.endDate < new Date()

  return [hasTransferredFromProgramme, hasTransferredToProgramme]
}
