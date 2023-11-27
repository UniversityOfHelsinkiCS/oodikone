import { createSlice, createSelector } from '@reduxjs/toolkit'

const slice = createSlice({
  name: 'filters',
  initialState: {
    views: {},
  },
  reducers: {
    setFilterOptions(state, action) {
      const { view, filter, options } = action.payload

      if (!state.views[view]) {
        state.views[view] = {}
      }

      if (!state.views[view][filter]) {
        state.views[view][filter] = {}
      }

      state.views[view][filter].options = options
    },

    resetFilter(state, action) {
      const { view, filter } = action.payload

      if (!state.views[view]) {
        state.views[view] = {}
      }

      state.views[view][filter] = {}
    },

    resetViewFilters(state, action) {
      const { view } = action.payload
      state.views[view] = {}
    },
  },
})

export const selectViewFilters = createSelector(
  state => state?.filters?.views,
  (state, view) => view,
  (viewMap, viewKey) => {
    if (viewMap) {
      const opts = viewMap[viewKey]

      if (opts) {
        return opts
      }
    }

    return {}
  }
)

export const { setFilterOptions, resetFilter, resetViewFilters } = slice.actions
export const { reducer } = slice
