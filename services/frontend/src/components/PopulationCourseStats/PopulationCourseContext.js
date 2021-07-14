import { createContext, useContext } from 'react'

export const PopulationCourseContext = createContext(null)

export const UsePopulationCourseContext = () => {
  return useContext(PopulationCourseContext)
}
