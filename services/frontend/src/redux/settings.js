import { DEFAULT_LANG } from '@/constants'

const initialState = {
  language: DEFAULT_LANG,
  namesVisible: false,
  chartHeight: 600,
}

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'TOGGLE_STUDENT_NAME_VISIBILITY':
      return {
        ...state,
        namesVisible: !state.namesVisible,
      }
    default:
      return state
  }
}

export const toggleStudentNameVisibility = () => ({
  type: 'TOGGLE_STUDENT_NAME_VISIBILITY',
})
