import React, { createContext, useState } from 'react'

const CourseFilterContext = createContext([[], () => {}])

const CourseFilterProvider = ({ children }) => {
  const [state, setState] = useState([])
  return <CourseFilterContext.Provider value={[state, setState]}>{children}</CourseFilterContext.Provider>
}

export { CourseFilterContext, CourseFilterProvider }
