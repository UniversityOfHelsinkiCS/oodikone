import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import 'semantic-ui-css/semantic.min.css'
import 'react-datetime/css/react-datetime.css'
import './styles/custom.css'
import { debugContextDevtool } from 'react-context-devtool'
import store from './store'
import ErrorBoundary from './components/ErrorBoundary'
import Main from './components/Main'
import CommonContext from './CommonContext'
import initializeSentry from './util/sentry'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

initializeSentry()

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
