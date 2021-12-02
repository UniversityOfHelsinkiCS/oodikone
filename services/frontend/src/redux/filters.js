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

      state.views[view][filter] = options
    },

    resetFilter(state, action) {
      const { view, filter } = action.payload

      if (state.views[view]) {
        state.views[view][filter] = {}
      } else {
        state.views[view] = { [filter]: {} }
      }
    },

    resetViewFilters(state, action) {
      const { view } = action.payload
      state.views[view] = {}
    },
  },
})

export const selectViewFilters = createSelector(
  state => state?.filters?.views,
  (state, view, initial) => [view, initial],
  (viewMap, [viewKey, initial]) => {
    if (viewMap) {
      const opts = viewMap[viewKey]

      if (opts) {
        return opts
      }

      if (initial) {
        return initial
      }

      return {}
    }

    return initial ?? {}
  }
)

export const { setFilterOptions, resetFilter, resetViewFilters } = slice.actions
export default slice.reducer
