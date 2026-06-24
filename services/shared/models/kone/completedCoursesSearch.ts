/* eslint-disable import-x/no-unused-modules */
import type { Optional } from '../../types'

export type CompletedCoursesSearchCreation = Optional<CompletedCoursesSearch, 'id'>
export type CompletedCoursesSearch = {
  id: string
  userId: string
  name: string
  courseCodes: string[]
}
