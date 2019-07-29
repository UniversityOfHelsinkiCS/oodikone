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

// This is done because react-localize-redux expects translations
// for all set languages, and we haven't translated anything to
// finnish or swedish in translations.json.
Object.keys(translations).forEach((k1) => {
  Object.keys(translations[k1]).forEach((k2) => {
    const val = translations[k1][k2][0]
    translations[k1][k2] = [val, val, val]
  })
})

store.dispatch(addTranslation(translations))

export default store
