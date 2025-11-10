/* eslint-disable import-x/no-unused-modules */
import type { Optional } from '../../types'

export type CustomPopulationSearchCreation = Optional<CustomPopulationSearch, 'id'>
export type CustomPopulationSearch = {
  id: string
  userId: string
  name: string
  students: string[]
  createdAt?: string // Both are dates
  updatedAt?: string
}
