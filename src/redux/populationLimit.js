export const clearPopulationLimit = () => ({
  type: 'CLEAR_POPULATION_LIMIT'
})


export const setPopulationLimit = (course, field) => ({
  type: 'SET_POPULATION_LIMIT',
  course,
  field
})

export const setPopulationLimitField = field => ({
  type: 'SET_POPULATION_LIMIT_FIELD',
  field
})

const reducer = (state = null, action) => {
  switch (action.type) {
    case 'SET_POPULATION_LIMIT':
      return {
        course: action.course,
        field: action.field
      }
    case 'SET_POPULATION_LIMIT_FIELD':
      return { ...state, field: action.field }
    case 'CLEAR_POPULATION_LIMIT':
      return null
    default:
      return state
  }
}

export default reducer
