import { createReducer } from '@reduxjs/toolkit'
import { callController, actionTypes } from '../apiConnection'
import { initialState, matcherReducers, defaultReducer } from './common'

const baseUrl = '/v2/studyprogrammes'
const getBasicsPrefix = 'GET_STUDY_PROGRAMME_BASIC_STATS_'
const getBasics = {
  ...actionTypes(getBasicsPrefix),
}

const getCreditsPrefix = 'GET_STUDY_PROGRAMME_CREDIT_STATS_'
const getCredits = {
  ...actionTypes(getCreditsPrefix),
}

export const getBasicStats = id => callController(`${baseUrl}/${id}/basicstats`, getBasicsPrefix)
export const getCreditStats = id => callController(`${baseUrl}/${id}/creditstats`, getCreditsPrefix)

const reducer = createReducer(
  initialState,
  {
    [getBasics.success]: (state, action) => {
      state.basicStats = action.response
    },
    [getCredits.success]: (state, action) => {
      state.creditStats = action.response
    },
  },
  matcherReducers,
  defaultReducer
)

export default reducer
