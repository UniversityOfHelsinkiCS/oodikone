import { decodeToken } from '../common'

export const login = () => ({
  type: 'LOGIN_ATTEMPT'
})

export const logout = () => ({ type: 'LOGOUT_ATTEMPT' })

const reducer = (state = { pending: false, error: false, token: null }, action) => {
  switch (action.type) {
    case 'LOGIN_ATTEMPT': return ({
      ...state,
      pending: true,
      error: false
    })

    case 'LOGIN_FAILURE': return ({
      ...state,
      pending: false,
      error: true
    })

    case 'LOGIN_SUCCESS': return ({
      ...state,
      pending: false,
      error: false,
      token: decodeToken(action.token)
    })

    case 'LOGOUT_ATTEMPT': return ({
      ...state,
      pending: true,
      error: false
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
