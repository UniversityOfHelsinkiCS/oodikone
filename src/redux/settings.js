const reducer = (state = { namesVisible: false }, action) => {
  switch (action.type) {
    case 'HIDE_STUDENT_NAMES':
      return {
        ...state,
        namesVisible: false
      }
    case 'SHOW_STUDENT_NAMES':
      return {
        ...state,
        namesVisible: true
      }
    case 'TOGGLE_STUDENT_NAME_VISIBILITY':
      return {
        ...state,
        namesVisible: !state.namesVisible
      }
    default:
      return state
  }
}

export const hideStudentNames = () => ({
  type: 'HIDE_STUDENT_NAMES'
})

export const showStudentNames = () => ({
  type: 'SHOW_STUDENT_NAMES'
})

export const toggleStudentNameVisibility = () => ({
  type: 'TOGGLE_STUDENT_NAME_VISIBILITY'
})

export default reducer
