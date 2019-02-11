import { callController } from '../apiConnection'
import { getAsUserWithoutRefreshToken } from '../common'

const initial = () => ({
  language: 'fi',
  namesVisible: false,
  studentlistVisible: false,
  chartHeight: 600,
  asUser: getAsUserWithoutRefreshToken()
})

export const switchLanguage = (username, language) => {
  const route = '/users/language'
  const prefix = 'SWITCH_LANGUAGE_'
  const data = { username, language }
  const method = 'post'
  return callController(route, prefix, data, method)
}

const reducer = (state = initial(), action) => {
  switch (action.type) {
    case 'INIT_LANGUAGE':
      return {
        ...state,
        language: action.language
      }
    case 'SWITCH_LANGUAGE_SUCCESS':
      return {
        ...state,
        language: action.response.language
      }
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
    case 'SET_CHART_HEIGHT':
      return {
        ...state,
        chartHeight: action.size
      }
    default:
      return state
  }
}

export const initLanguage = language => ({
  type: 'INIT_LANGUAGE',
  language
})

export const hideStudentNames = () => ({
  type: 'HIDE_STUDENT_NAMES'
})

export const showStudentNames = () => ({
  type: 'SHOW_STUDENT_NAMES'
})

export const setChartHeight = size => ({
  type: 'SET_CHART_HEIGHT',
  size
})

export const toggleStudentNameVisibility = () => ({
  type: 'TOGGLE_STUDENT_NAME_VISIBILITY'
})

export const toggleStudentListVisibility = () => ({
  type: 'TOGGLE_STUDENT_LIST_VISIBILITY'
})

export default reducer
