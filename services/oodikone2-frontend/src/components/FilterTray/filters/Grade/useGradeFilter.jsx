import React, { createContext, useState, useContext } from 'react'
import PropTypes from 'prop-types'

const defaultState = {
  value: [],
  grades: {}
}

const GradeFilterContext = createContext([[], () => {}])
GradeFilterContext.displayName = 'Grade Filter'

export const GradeFilterProvider = ({ children }) => {
  const [state, setState] = useState(defaultState)
  return <GradeFilterContext.Provider value={[state, setState]}>{children}</GradeFilterContext.Provider>
}

GradeFilterProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export default () => {
  const [state, setState] = useContext(GradeFilterContext)

  return {
    value: state.value,
    setValue: value => setState(prev => ({ ...prev, value })),
    grades: state.grades,
    setGrades: grades => setState(prev => ({ ...prev, grades }))
  }
}
