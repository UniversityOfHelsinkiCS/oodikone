/* eslint-disable import-x/no-unused-modules */
import type { Optional } from '../../types'

export type ProgressCriteriaCreation = Optional<ProgressCriteria, 'curriculumVersion'>
export type ProgressCriteria = {
  code: string
  curriculumVersion: string
  coursesYearOne: string[]
  coursesYearTwo: string[]
  coursesYearThree: string[]
  coursesYearFour: string[]
  coursesYearFive: string[]
  coursesYearSix: string[]
  creditsYearOne: number
  creditsYearTwo: number
  creditsYearThree: number
  creditsYearFour: number
  creditsYearFive: number
  creditsYearSix: number
}
