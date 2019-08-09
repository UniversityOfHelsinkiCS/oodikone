export const login = (force = false, retryRequestSettings = null, uid = null, refresh = false) => ({
  type: 'LOGIN_ATTEMPT',
  force,
  retryRequestSettings,
  uid,
  refresh
})

export const logout = () => ({ type: 'LOGOUT_ATTEMPT' })

const reducer = (state = { token: null }, action) => {
  switch (action.type) {
    case 'LOGIN_ATTEMPT': return ({
      ...state,
      pending: true
    })

    case 'LOGIN_FAILURE': return ({
      ...state,
      pending: false,
      error: true
    })

    case 'LOGIN_SUCCESS': return ({
      ...state,
      pending: false,
      token: action.token,
      error: false
    })

    case 'LOGOUT_ATTEMPT': return ({
      ...state,
      pending: true
    })

    case 'LOGOUT_FAILURE': return ({
      ...state,
      pending: false,
      error: true,
      token: null
    })

    case 'LOGOUT_SUCCESS': return ({
      ...state,
      pending: false,
      error: false,
      token: null
    })

    default: return state
  }
}

export default reducer
