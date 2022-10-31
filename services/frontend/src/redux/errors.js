import { v4 as uuidv4 } from 'uuid'

export const sendError = (message = 'Something went wrong') => ({
  type: 'ADD_ERROR',
  error: {
    message,
    uuid: uuidv4(),
  },
})

export const removeError = uuid => ({
  type: 'REMOVE_ERROR',
  uuid,
})

const reducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_ERROR':
      return [...state, action.error]
    case 'REMOVE_ERROR':
      return state.filter(error => error.uuid === action.uuid)
    default:
      return state
  }
}

export default reducer
