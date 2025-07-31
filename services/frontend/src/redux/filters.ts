import { createSlice, createSelector } from '@reduxjs/toolkit'

import type { RootState } from '@/redux'

const slice = createSlice({
  name: 'filters',
  initialState: {
    views: {},
  },
  reducers: {
    setViewFilterOptions(state, action) {
      const { view, filter, options } = action.payload

      state.views[view] ??= {}
      state.views[view][filter] = options
    },

    resetViewFilter(state, action) {
      const { view, filter } = action.payload
      delete state.views[view]?.[filter]
    },

    resetAllViewFilters(state, action) {
      const { view } = action.payload
      state.views[view] = {}
    },
  },
})

export const selectViewFilters = createSelector(
  (state: RootState) => state?.filters?.views,
  (_: RootState, view: string): string => view,
  (state, view) => state?.[view] ?? {}
)

export const { setViewFilterOptions, resetViewFilter, resetAllViewFilters } = slice.actions
export const { reducer } = slice
