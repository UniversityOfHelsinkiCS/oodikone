import { createSlice } from '@reduxjs/toolkit/react'
import { DEFAULT_LANG } from '@oodikone/shared/language'

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    language: DEFAULT_LANG,
    namesVisible: false,
  },
  reducers: {
    toggleStudentNameVisibility: state => {
      state.namesVisible = !state.namesVisible
    },
  },
})

export const { toggleStudentNameVisibility } = settingsSlice.actions

export const { reducer } = settingsSlice
