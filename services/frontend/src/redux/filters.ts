import { createSlice, createSelector } from '@reduxjs/toolkit'
import { FilterContext, getDefaultFilterContext } from '@/components/FilterView/context'

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

      state.views[view] ??= {}
      state.views[view][filter] = getDefaultFilterContext()
    },

    resetViewFilters(state, action) {
      const { view } = action.payload
      state.views[view] = {}
    },
  },
})

export const selectViewFilters = createSelector(
  state => state?.filters?.views,
  (_, view): string => view,
  (state, view): Record<string, FilterContext> => {
    if (state) {
      const opts = state[view]

      if (opts) {
        return opts
      }
    }

    return {}
  }
)

export const { setFilterOptions, resetFilter, resetViewFilters } = slice.actions
export const { reducer } = slice
