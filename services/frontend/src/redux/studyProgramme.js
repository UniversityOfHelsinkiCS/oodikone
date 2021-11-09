import { createReducer } from '@reduxjs/toolkit'
import { callController, actionTypes } from '../apiConnection'
import { initialState, matcherReducers, defaultReducer } from './common'

const baseUrl = '/v2/studyprogrammes'
const getPrefix = 'GET_STUDY_PROGRAMME_BASIC_STATS'
const getTypes = {
  ...actionTypes(getPrefix),
}

export const getBasicStats = id => callController(`${baseUrl}/${id}/basicstats`, getPrefix)

const reducer = createReducer(
  initialState,
  {
    [getTypes.success]: (state, action) => {
      state.data = action.response
    },
  },
  matcherReducers,
  defaultReducer
)

export default reducer
