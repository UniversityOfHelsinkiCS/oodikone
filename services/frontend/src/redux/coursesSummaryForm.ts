import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { ALL } from '@/selectors/courseStats'

const initialState: { programmes: string[] } = { programmes: [ALL.value] }

const coursesSummaryFormSlice = createSlice({
  name: 'coursesSummaryForm',
  initialState,
  reducers: {
    setProgrammes(state, action: PayloadAction<string[]>) {
      state.programmes = action.payload
    },
  },
})

export const { setProgrammes } = coursesSummaryFormSlice.actions

export const { reducer } = coursesSummaryFormSlice
