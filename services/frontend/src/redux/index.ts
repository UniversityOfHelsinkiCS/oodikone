import { setupListeners } from '@reduxjs/toolkit/query/react'
import { configureStore } from '@reduxjs/toolkit/react'

import { RTKApi } from '@/apiConnection'
import { isDev } from '@/conf'
import { actionHistoryMiddleware } from './actionHistory'
import { reducer as selectedCourse } from './selectedCourse'
import { reducer as settings } from './settings'

export const store = configureStore({
  reducer: {
    selectedCourse,
    settings,
    [RTKApi.reducerPath]: RTKApi.reducer,
  },
  devTools: isDev,
  duplicateMiddlewareCheck: isDev,
  // oodikone is currently too heavy for other middlewares than thunk, but
  // feel free to take use them at some point if possible
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ immutableCheck: false, serializableCheck: false }).concat(
      RTKApi.middleware,
      actionHistoryMiddleware
    ),
})
setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
