import { createSlice, createSelector } from '@reduxjs/toolkit/react'

import type { RootState } from '@/redux'

export const selectViewFilters = createSelector(
  (state: RootState) => state.filters,
  state => state?.filterState ?? {}
)

const slice = createSlice({
  name: 'filters',
  initialState: {
    filterState: {},
  },
  reducers: {
    setViewFilterOptions: (state, { payload }) => {
      state.filterState[payload.filter] = payload.options
    },

    resetViewFilter: (state, { payload }) => {
      delete state.filterState?.[payload.filter]
    },

    resetAllViewFilters: state => {
      state.filterState = {}
    },
  },
})

export const { setViewFilterOptions, resetViewFilter, resetAllViewFilters } = slice.actions
export const { reducer } = slice
