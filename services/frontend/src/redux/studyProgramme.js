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

const getGraduationPrefix = 'GET_STUDY_PROGRAMME_GRADUATION_STATS_'
const getGraduation = {
  ...actionTypes(getGraduationPrefix),
}

export const getBasicStats = id => callController(`${baseUrl}/${id}/basicstats`, getBasicsPrefix)
export const getCreditStats = id => callController(`${baseUrl}/${id}/creditstats`, getCreditsPrefix)
export const getGraduationStats = id => callController(`${baseUrl}/${id}/graduationstats`, getGraduationPrefix)

const reducer = createReducer(
  initialState,
  {
    [getBasics.success]: (state, action) => {
      state.basicStats = action.response
    },
    [getCredits.success]: (state, action) => {
      state.creditStats = action.response
    },
    [getGraduation.success]: (state, action) => {
      state.graduationStats = action.response
    },
  },
  matcherReducers,
  defaultReducer
)

export default reducer
