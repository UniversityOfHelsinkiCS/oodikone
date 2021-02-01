import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import * as Sentry from '@sentry/browser'
import 'semantic-ui-css/semantic.min.css'
import 'react-datetime/css/react-datetime.css'
import './styles/custom.css'
import { debugContextDevtool } from 'react-context-devtool'
import { BASE_PATH } from './constants'
import store from './store'
import ErrorBoundary from './components/ErrorBoundary'
import Main from './components/Main'
import CommonContext from './CommonContext'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

try {
  if (IS_PRODUCTION && BASE_PATH === '/' && ['staging', 'latest'].includes(process.env.TAG)) {
    Sentry.init({
      environment: process.env.TAG,
      dsn: 'https://c55e6d020db640e889948cc25ced1c19@sentry.toska.cs.helsinki.fi/2',
      release: process.env.SENTRY_RELEASE_VERSION
    })
  }
} catch (e) {
  console.log(e) // eslint-disable-line no-console
}

const container = document.getElementById('root')

ReactDOM.render(
  <Provider store={store}>
    <CommonContext>
      <ErrorBoundary>
        <Main />
      </ErrorBoundary>
    </CommonContext>
  </Provider>,
  container
)

// Best not to use this in production as the performance impact appears to be quite high.
debugContextDevtool(container, { disable: IS_PRODUCTION })

if (module.hot) {
  module.hot.accept()
}
