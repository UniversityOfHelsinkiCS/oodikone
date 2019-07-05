import { createStore, applyMiddleware, compose } from 'redux'

import { initialize, addTranslation } from 'react-localize-redux'
import thunk from 'redux-thunk'

import { AVAILABLE_LANGUAGES, DEFAULT_LANG } from './constants'
import reducers from './redux'
import { handleRequest, handleAuth } from './apiConnection'

const translations = require('./i18n/translations.json')

// eslint-disable-next-line
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const store = createStore(
  reducers,
  composeEnhancers(applyMiddleware(thunk, handleRequest, handleAuth))
)
store.dispatch(initialize(AVAILABLE_LANGUAGES, { defaultLanguage: DEFAULT_LANG }))
store.dispatch(addTranslation(translations))

export default store
