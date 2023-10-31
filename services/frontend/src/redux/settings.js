import { DEFAULT_LANG } from '../constants'

const initialState = {
  language: DEFAULT_LANG,
  namesVisible: false,
  chartHeight: 600,
}

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'HIDE_STUDENT_NAMES':
      return {
        ...state,
        namesVisible: false,
      }
    case 'SHOW_STUDENT_NAMES':
      return {
        ...state,
        namesVisible: true,
      }
    case 'TOGGLE_STUDENT_NAME_VISIBILITY':
      return {
        ...state,
        namesVisible: !state.namesVisible,
      }
    case 'SET_CHART_HEIGHT':
      return {
        ...state,
        chartHeight: action.size,
      }
    default:
      return state
  }
}

export const hideStudentNames = () => ({
  type: 'HIDE_STUDENT_NAMES',
})

export const showStudentNames = () => ({
  type: 'SHOW_STUDENT_NAMES',
})

export const setChartHeight = size => ({
  type: 'SET_CHART_HEIGHT',
  size,
})

export const toggleStudentNameVisibility = () => ({
  type: 'TOGGLE_STUDENT_NAME_VISIBILITY',
})

export default reducer
