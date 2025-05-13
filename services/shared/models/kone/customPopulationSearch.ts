import type { Optional } from '../../types'

export type CustomPopulationSearchCreation = Optional<CustomPopulationSearch, 'id'>
export type CustomPopulationSearch = {
  id: string
  userId: string
  name: string
  students: string[]
}
