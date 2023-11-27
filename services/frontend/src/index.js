/* eslint-disable react/jsx-filename-extension */
// eslint-disable-next-line import/no-unused-modules
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import 'semantic-ui-css/semantic.min.css'
import 'react-datetime/css/react-datetime.css'
import './styles/custom.css'
import { store } from './redux'
import { ConnectedErrorBoundary as ErrorBoundary } from './components/ErrorBoundary'
import { App } from './components/App'
import { CommonContext } from './components/common/CommonContext'
import { initializeSentry } from './util/sentry'
import { basePath } from './conf'

initializeSentry()

ReactDOM.render(
  <Provider store={store}>
    <CommonContext>
      <BrowserRouter basename={basePath}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </CommonContext>
  </Provider>,
  document.getElementById('root')
)
