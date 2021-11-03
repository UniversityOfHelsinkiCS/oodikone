import { actionSuffixes } from '../../apiConnection'

export const matcherReducers = [
  {
    matcher: action => action.type.endsWith(actionSuffixes.attempt),
    reducer(state) {
      state.error = false
      state.pending = true
    },
  },
  {
    matcher: action => action.type.endsWith(actionSuffixes.failure),
    reducer(state) {
      state.error = true
      state.pending = false
    },
  },
  {
    matcher: action => action.type.endsWith(actionSuffixes.success),
    reducer(state) {
      state.error = false
      state.pending = false
    },
  },
]

export const defaultReducer = () => {}

export const initialState = {
  pending: false,
  error: false,
  data: [],
}
