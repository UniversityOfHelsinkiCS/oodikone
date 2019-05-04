import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import * as Sentry from '@sentry/browser'
import 'semantic-ui-css/semantic.min.css'
import 'react-datetime/css/react-datetime.css'
import './styles/custom.css'

import { BASE_PATH } from './constants'

import store from './store'
import ErrorBoundary from './components/ErrorBoundary'
import Main from './components/Main'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

try {
  if (IS_PRODUCTION && BASE_PATH === '/') {
    Sentry.init({ dsn: 'https://02d07bd40f404cc0965f38f06183d9fb@toska.cs.helsinki.fi/3' }) // eslint-disable-line
  }
} catch (e) {
  console.log(e) // eslint-disable-line
}

ReactDOM.render(
  <Provider store={store}>
    <ErrorBoundary>
      <Main />
    </ErrorBoundary>
  </Provider>,
  document.getElementById('root')
)

if (module.hot) {
  module.hot.accept()
}

