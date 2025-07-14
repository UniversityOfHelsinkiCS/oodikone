import { createSlice, createSelector } from '@reduxjs/toolkit'
import { getDefaultFilterContext } from '@/components/FilterView/context'

import type { RootState } from '@/redux'

const slice = createSlice({
  name: 'filters',
  initialState: {
    views: {},
  },
  reducers: {
    setFilterOptions(state, action) {
      const { view, filter, options } = action.payload

      state.views[view] ??= {}
      state.views[view][filter] ??= getDefaultFilterContext()
      state.views[view][filter].options = options
    },

    resetFilter(state, action) {
      const { view, filter } = action.payload

      if (state.views[view]?.[filter]) {
        delete state.views[view][filter]
      }
    },

    resetViewFilters(state, action) {
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

export const { setFilterOptions, resetFilter, resetViewFilters } = slice.actions
export const { reducer } = slice
