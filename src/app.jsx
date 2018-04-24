import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import { createStore, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import { initialize, addTranslation } from 'react-localize-redux'
import thunk from 'redux-thunk'

import 'semantic-ui-css/semantic.min.css'
import 'react-datetime/css/react-datetime.css'
import './styles/global'

import { AVAILABLE_LANGUAGES, DEFAULT_LANG } from './constants'
import reducers from './redux'
import { handleRequest } from './apiConnection'
import Main from './components/Main'

try {
  Raven.config('http://02d07bd40f404cc0965f38f06183d9fb@toska.cs.helsinki.fi:8500/3').install() // eslint-disable-line
} catch (e) { } // eslint-disable-line

const translations = require('./i18n/translations.json')

// eslint-disable-next-line
const composeEnhancers = (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

const store = createStore(reducers, composeEnhancers(applyMiddleware(thunk, handleRequest)))
store.dispatch(initialize(AVAILABLE_LANGUAGES, { defaultLanguage: DEFAULT_LANG }))
store.dispatch(addTranslation(translations))


const render = (Component) => {
  ReactDOM.render(
    <Provider store={store}>
      <AppContainer>
        <Component />
      </AppContainer>
    </Provider>,
    document.getElementById('root')
  )
}

render(Main)

if (module.hot) {
  module.hot.accept('./components/Main', () => {
    render(Main)
  })
}

