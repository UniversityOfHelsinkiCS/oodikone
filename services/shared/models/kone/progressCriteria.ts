/* eslint-disable import-x/no-unused-modules */
import type { Optional } from '../../types'

export type ProgressCriteriaCreation = Optional<ProgressCriteria, 'curriculumVersion'>
export type ProgressCriteria = {
  code: string
  curriculumVersion: string
  courseGroupIdsYearOne: string[]
  courseGroupIdsYearTwo: string[]
  courseGroupIdsYearThree: string[]
  courseGroupIdsYearFour: string[]
  courseGroupIdsYearFive: string[]
  courseGroupIdsYearSix: string[]
  creditsYearOne: number
  creditsYearTwo: number
  creditsYearThree: number
  creditsYearFour: number
  creditsYearFive: number
  creditsYearSix: number
}
