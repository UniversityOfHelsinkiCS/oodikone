import { isMedicalProgramme } from '@/util/studyProgramme'
import { ProgressCriteria } from '@oodikone/shared/types'

export type CriteriaYearKey = keyof ProgressCriteria['courses']

export type CriteriaYearOption = {
  key: CriteriaYearKey
  label: string
  year: number
}

const allCriteriaYears: CriteriaYearOption[] = [
  { key: 'yearOne', label: 'First', year: 1 },
  { key: 'yearTwo', label: 'Second', year: 2 },
  { key: 'yearThree', label: 'Third', year: 3 },
  { key: 'yearFour', label: 'Fourth', year: 4 },
  { key: 'yearFive', label: 'Fifth', year: 5 },
  { key: 'yearSix', label: 'Sixth', year: 6 },
]

/** Academic years that can have progress criteria in the given programme (six for medicine, otherwise three) */
export const getCriteriaYears = (programmeCode: string) =>
  isMedicalProgramme(programmeCode) ? allCriteriaYears : allCriteriaYears.slice(0, 3)
