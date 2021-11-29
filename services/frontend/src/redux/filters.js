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
  state => state?.filters?.views,
  (state, view) => view,
  (viewMap, viewKey) => {
    if (viewMap && viewMap[viewKey]) {
      return viewMap[viewKey]
    }

    return {}
  }
)

export const { setFilterOptions, resetFilter, resetViewFilters } = slice.actions
export default slice.reducer
