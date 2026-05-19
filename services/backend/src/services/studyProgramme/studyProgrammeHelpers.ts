import { orderBy } from 'lodash-es'
import { Op } from 'sequelize'

import { Credit, SISStudyRight, SISStudyRightElement } from '@oodikone/shared/models'
import { DegreeProgrammeType, Phase } from '@oodikone/shared/types'
import { programmeCodes } from '../../config/programmeCodes'
import { ProgrammeModuleModel } from '../../models'
import { getDegreeProgrammeType } from '../../util'
import { GraduationTarget } from '../graduationHelpers'

export function getYearsArray(since: number, isAcademicYear: true, yearsCombined?: boolean): string[]
export function getYearsArray(since: number, isAcademicYear: false, yearsCombined: true): Array<'Total' | number>
export function getYearsArray(since: number, isAcademicYear: false, yearsCombined?: false): number[]
export function getYearsArray(since: number, isAcademicYear: boolean, yearsCombined?: boolean): Array<string | number>
export function getYearsArray(since: number, isAcademicYear: boolean, yearsCombined?: boolean) {
  const today = new Date()
  const until = isAcademicYear && today.getMonth() < 7 ? today.getFullYear() - 1 : today.getFullYear()
  const years: Array<string | number> = []

  if (yearsCombined) {
    years.push('Total')
  }

  for (let i = since; i <= until; i++) {
    years.push(isAcademicYear ? `${i} - ${i + 1}` : i)
  }

  return years
}

export function getYearsObject(params: { years: Array<string | number>; emptyArrays: true }): Record<string, []>
export function getYearsObject(params: { years: Array<string | number>; emptyArrays?: false }): Record<string, number>
export function getYearsObject(params: { years: Array<string | number>; emptyArrays?: boolean }) {
  const { years, emptyArrays } = params

  return Object.fromEntries(years.map(year => [year, emptyArrays ? [] : 0]))
}

export const getStatsBasis = (years: Array<string | number>) => {
  return {
    graphStats: new Array<number>(years.length).fill(0),
    tableStats: getYearsObject({ years }),
  }
}

export const getMedian = (values: number[]) => {
  if (!values.length) return 0

  // compareFn mandatory
  const sorted = values.toSorted((a, b) => a - b)

  const half = Math.floor(sorted.length / 2)
  if (sorted.length % 2) {
    return sorted[half]
  }
  return (sorted[half - 1] + sorted[half]) / 2.0
}

/** @returns academic starting year e.g. "2019-2020" */
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

const filterCreditsByDate = (credits: Credit[], threshold: Date) => credits.filter(credit => threshold <= credit.attainment_date)

export const getCreditCount = (credits: Credit[], startDate: Date) => (
  filterCreditsByDate(credits, startDate).reduce((prev, curr) => prev + curr.credits, 0)
)

/**
* @param startDate exact date when started in programme to cut credits with
* @param startYear academic start year
*/
export const getMonthlyCredits = (credits: Credit[], startDate: Date, startYear: number, monthlyCredits: Record<string, number[]>) => {
  const filteredCredits = filterCreditsByDate(credits, startDate)
  const studentMonthlyCredits = getMonthlyCreditsObj(startYear)

  for (const credit of filteredCredits) {
    const creditKey = `${credit.attainment_date.getFullYear()}-${credit.attainment_date.getMonth() + 1}`
    studentMonthlyCredits[creditKey].push(credit.credits)
  }

  /* Add credits of individual student to the main obj */
  let accumulator = 0
  for (const creditKey of Object.keys(monthlyCredits)) {
    for (const credit of studentMonthlyCredits[creditKey]) {
      accumulator += credit
    }

    monthlyCredits[creditKey].push(accumulator)
  }
}

export const getStartDate = (isAcademicYear: boolean, year: number = 2017) => {
  return isAcademicYear ? new Date(`${year}-08-01`) : new Date(`${year}-01-01`)
}

export const getYearlyMonthlyCreditsObj = () => {
  const yearlyMonthlyCredits: Record<string, ReturnType<typeof getMonthlyCreditsObj>> = {}
  const today = new Date()

  for (let year = getStartDate(true).getFullYear(); year <= today.getFullYear(); year++) {
    yearlyMonthlyCredits[year] = getMonthlyCreditsObj(year)
  }

  return yearlyMonthlyCredits
}

const getMonthlyCreditsObj = (academicStartYear?: number) => {
  const today = new Date()
  let time = getStartDate(true, academicStartYear)

  const monthlyCredits: Record<string, number[]> = {}
  today.setDate(1)

  /* NB: JS months start at 0. We need them to start at 1. */
  while (time < today) {
    monthlyCredits[`${time.getFullYear()}-${time.getMonth() + 1}`] = []
    time.setMonth(time.getMonth() + 1)
  }

  return monthlyCredits
}

export const computePercentiles = (yearlyMonthlyCredits: Record<string, Record<string, number[]>>, percentiles = [10, 25, 50, 75, 90]) => {
  const values: Record<string, Record<string, [string, number][]>> = {}

  const interpolate = (percentile: number, credits: number[]) => {
    const n = credits.length
    const p = percentile / 100

    const index = (n - 1) * p
    const lower = Math.ceil(index)
    const upper = Math.floor(index)
    const weight = index - lower

    if (upper >= n) return credits[lower]
    if (lower === upper) return credits[lower]

    return credits[lower] * (1 - weight) + credits[upper] * weight
  }

  for (const yearKey of Object.keys(yearlyMonthlyCredits)) {
    for (const monthlyKey of Object.keys(yearlyMonthlyCredits[yearKey])) {
      const sortedCredits = yearlyMonthlyCredits[yearKey][monthlyKey].sort((a, b) => a - b)
      for (const percentile of percentiles) {
        values[yearKey] ??= {}
        values[yearKey][percentile] ??= []
        values[yearKey][percentile].push([monthlyKey, Number(interpolate(percentile, sortedCredits).toFixed(1))])
      }
    }
  }

  return values
}


// In the object programmes should be {bachelorCode: masterCode}
export const combinedStudyProgrammes = { KH90_001: 'MH90_001' } as const

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

export const getThesisType = async (studyProgramme: string) => {
  const degreeProgrammeType = await getDegreeProgrammeType(studyProgramme)
  if (degreeProgrammeType === DegreeProgrammeType.MASTER) {
    const mastersThesisTypes = ['urn:code:course-unit-type:masters-thesis']
    return mastersThesisTypes
  }

  if (degreeProgrammeType === DegreeProgrammeType.BACHELOR) {
    const bachelorsThesisTypes = ['urn:code:course-unit-type:bachelors-thesis']
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
  studytracksStart: ['', 'All', 'Started\nstudying', 'Present', 'Absent', 'Passive'],
  studytracksBasic: ['Graduated'],
  studytracksCombined: {
    licentiate: ['Graduated bachelor', 'Graduated licentiate'],
    master: ['Graduated bachelor', 'Graduated master'],
  },
  studytracksEnd: ['Men', 'Women', 'Other / Unknown', 'Finland', 'Other'],
} as const

export const getId = (code: string) => {
  return code in programmeCodes ? programmeCodes[code as keyof typeof programmeCodes] : ''
}

export const getGoal = async (programme?: string) => {
  if (!programme) return 0
  const programmeInfo = await ProgrammeModuleModel.findAll({
    attributes: ['degreeProgrammeType', 'minimumCredits'],
    where: {
      code: programme,
      valid_from: {
        [Op.lte]: new Date(),
      },
    },
    order: [['valid_from', 'DESC']],
  })
  if (programmeInfo.length === 0) {
    return 0
  }
  const { degreeProgrammeType, minimumCredits } = programmeInfo[0]
  if (degreeProgrammeType === null || minimumCredits === null) {
    return 0
  }
  if ([DegreeProgrammeType.DOCTOR, DegreeProgrammeType.LICENTIATE].includes(degreeProgrammeType)) {
    return GraduationTarget.FOUR_YEARS
  }
  return ((minimumCredits / 60) * 12) / 6 // 60 Credits per year divided to semesters
}

export const isRelevantProgramme = (code: string) => /^(KH|MH)\d{2}_\d{3}$/.test(code) || /^T\d{6}$/.test(code)

export const getStudyRightElementsWithPhase = (studyRight: Pick<SISStudyRight, 'studyRightElements'>, phase: Phase) => {
  return orderBy(
    studyRight.studyRightElements.filter(element => element.phase === phase),
    ['startDate'],
    ['asc']
  )
}

export const hasTransferredFromOrToProgramme = (
  studyRight: Pick<SISStudyRight, 'studyRightElements'>,
  studyRightElement: Pick<SISStudyRightElement, 'code' | 'phase' | 'startDate' | 'endDate'>
): [boolean, boolean] => {
  const studyRightElementsWithSamePhase = getStudyRightElementsWithPhase(studyRight, studyRightElement.phase)
  const hasTransferredToProgramme =
    studyRightElementsWithSamePhase[0].code !== studyRightElement.code && studyRightElement.startDate < new Date()
  const hasTransferredFromProgramme =
    studyRightElementsWithSamePhase[studyRightElementsWithSamePhase.length - 1].code !== studyRightElement.code &&
    studyRightElement.endDate < new Date()

  return [hasTransferredFromProgramme, hasTransferredToProgramme]
}
