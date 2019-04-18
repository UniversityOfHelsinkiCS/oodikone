export const clearLoading = () => ({
  type: 'SET_NOT_LOADING'
})

export const setLoading = () => ({
  type: 'SET_LOADING'
})

const reducer = (state = false, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return true
    case 'SET_NOT_LOADING':
      return false
    default:
      return state
  }
}

export default reducer
