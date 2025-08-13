import { createSlice, PayloadAction } from '@reduxjs/toolkit/react'

const initialState: { selectedCourse: string | null } = { selectedCourse: null }

const selectedCourseSlice = createSlice({
  name: 'selectedCourse',
  initialState,
  reducers: {
    setSelectedCourse(state, action: PayloadAction<string>) {
      state.selectedCourse = action.payload
    },
    clearSelectedCourse(state) {
      state.selectedCourse = null
    },
  },
})

export const { setSelectedCourse, clearSelectedCourse } = selectedCourseSlice.actions

export const { reducer } = selectedCourseSlice
