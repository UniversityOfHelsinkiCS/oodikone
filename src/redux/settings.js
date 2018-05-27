const initial = {
  namesVisible: false,
  studentlistVisible: false
}

const reducer = (state = initial, action) => {
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
    case 'TOGGLE_STUDENT_LIST_VISIBILITY':
      return {
        ...state,
        studentlistVisible: !state.studentlistVisible
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

export const toggleStudentListVisibility = () => ({
  type: 'TOGGLE_STUDENT_LIST_VISIBILITY'
})

export default reducer
