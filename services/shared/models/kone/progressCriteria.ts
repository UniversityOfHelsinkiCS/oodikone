/* eslint-disable import-x/no-unused-modules */
import type { Optional } from '../../types'

export type ProgressCriteriaCreation = Optional<ProgressCriteria, 'curriculumVersion'>
export type ProgressCriteria = {
  code: string
  curriculumVersion: string
  // TODO: Remove coursesYear* once all rows have been migrated to courseGroupIdsYear*
  coursesYearOne: string[]
  coursesYearTwo: string[]
  coursesYearThree: string[]
  coursesYearFour: string[]
  coursesYearFive: string[]
  coursesYearSix: string[]
  courseGroupIdsYearOne: string[] | null
  courseGroupIdsYearTwo: string[] | null
  courseGroupIdsYearThree: string[] | null
  courseGroupIdsYearFour: string[] | null
  courseGroupIdsYearFive: string[] | null
  courseGroupIdsYearSix: string[] | null
  creditsYearOne: number
  creditsYearTwo: number
  creditsYearThree: number
  creditsYearFour: number
  creditsYearFive: number
  creditsYearSix: number
}
