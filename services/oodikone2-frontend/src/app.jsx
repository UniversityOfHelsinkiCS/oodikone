import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import { createStore, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import { initialize, addTranslation } from 'react-localize-redux'
import thunk from 'redux-thunk'

import * as Sentry from '@sentry/browser'
import 'semantic-ui-css/semantic.min.css'
import 'react-datetime/css/react-datetime.css'
import './styles/custom.css'

import { AVAILABLE_LANGUAGES, DEFAULT_LANG, BASE_PATH } from './constants'
import reducers from './redux'
import { handleRequest } from './apiConnection'
import Main from './components/Main'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const av = navigator.appVersion
console.log(av) // eslint-disable-line
if (av.indexOf('MSIE') !== -1 || av.indexOf('Trident/') !== -1) {
  alert("Internet Explorer is not supported. Please use a web browser from this decade. e.g. Google Chrome or Firefox.") // eslint-disable-line
}
try {
  if (IS_PRODUCTION && BASE_PATH === '/') {
    Sentry.init({ dsn: 'https://02d07bd40f404cc0965f38f06183d9fb@toska.cs.helsinki.fi/3' }) // eslint-disable-line
  }
} catch (e) {
  console.log(e) // eslint-disable-line
}

const translations = require('./i18n/translations.json')

// eslint-disable-next-line
const composeEnhancers = (!IS_PRODUCTION && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose

const store = createStore(reducers, composeEnhancers(applyMiddleware(thunk, handleRequest)))
store.dispatch(initialize(AVAILABLE_LANGUAGES, { defaultLanguage: DEFAULT_LANG }))
store.dispatch(addTranslation(translations))

const render = (Component) => {
  ReactDOM.render(
    <Provider store={store}>
      <AppContainer>
        <Component store={store} />
      </AppContainer>
    </Provider>,
    document.getElementById('root')
  )
}

render(Main)

if (module.hot) {
  module.hot.accept()
}

