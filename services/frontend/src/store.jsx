import { configureStore } from '@reduxjs/toolkit'
import reducers from './redux'
import { handleRequest, handleAuth } from './apiConnection'

const store = configureStore({
  reducer: {
    ...reducers,
  },
  middleware: getDefaultMiddleware => [...getDefaultMiddleware(), handleRequest, handleAuth],
})

export default store
