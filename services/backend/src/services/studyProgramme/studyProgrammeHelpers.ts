import { orderBy } from 'lodash'
import { Op } from 'sequelize'

import { SISStudyRight, SISStudyRightElement } from '@oodikone/shared/models'
import { DegreeProgrammeType, Phase } from '@oodikone/shared/types'
import { serviceProvider } from '../../config'
import { programmeCodes } from '../../config/programmeCodes'
import { ProgrammeModuleModel } from '../../models'
import { getDegreeProgrammeType } from '../../util'

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
    graphStats: new Array<number>(years.length).fill(0),
    tableStats: getYearsObject({ years }) as Record<string, number>,
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
    if (serviceProvider !== 'toska') {
      mastersThesisTypes.push('urn:code:course-unit-type:amk-masters-thesis')
    }
    return mastersThesisTypes
  }

  if (degreeProgrammeType === DegreeProgrammeType.BACHELOR) {
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
  studytracksEnd: ['Men', 'Women', 'Other / Unknown', 'Finland', 'Other'],
} as const

export const getId = (code: string) => {
  if (serviceProvider !== 'fd') return code in programmeCodes ? programmeCodes[code as keyof typeof programmeCodes] : ''
  return code
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
    return 48
  }
  return (minimumCredits / 60) * 12
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
