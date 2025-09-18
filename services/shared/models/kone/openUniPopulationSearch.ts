/* eslint-disable import-x/no-unused-modules */
import type { Optional } from '../../types'

export type OpenUniPopulationSearchCreation = Optional<OpenUniPopulationSearch, 'id'>
export type OpenUniPopulationSearch = {
  id: string
  userId: string
  name: string
  courseCodes: string[]
}
