import { isMedicalProgramme } from '@/util/studyProgramme'
import { ProgressCriteria } from '@oodikone/shared/types'

export type CriteriaYearKey = keyof ProgressCriteria['courses']

export type CriteriaYearOption = {
  key: CriteriaYearKey
  label: string
  year: number
}

const allCriteriaYears: CriteriaYearOption[] = [
  { key: 'yearOne', label: 'first', year: 1 },
  { key: 'yearTwo', label: 'second', year: 2 },
  { key: 'yearThree', label: 'third', year: 3 },
  { key: 'yearFour', label: 'fourth', year: 4 },
  { key: 'yearFive', label: 'fifth', year: 5 },
  { key: 'yearSix', label: 'sixth', year: 6 },
]

/** Academic years that can have progress criteria in the given programme (six for medicine, otherwise three) */
export const getCriteriaYears = (programmeCode: string) =>
  isMedicalProgramme(programmeCode) ? allCriteriaYears : allCriteriaYears.slice(0, 3)
