import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { Router } from 'react-router-dom'
import { createBrowserHistory } from 'history'
import TSA from './common/tsa'
import 'semantic-ui-css/semantic.min.css'
import 'react-datetime/css/react-datetime.css'
import './styles/custom.css'
import store from './redux'
import ErrorBoundary from './components/ErrorBoundary'
import App from './components/App'
import CommonContext from './components/common/CommonContext'
import initializeSentry from './util/sentry'
import { basePath } from './conf'

initializeSentry()

const history = TSA.Matomo.connectToHistory(createBrowserHistory())

ReactDOM.render(
  <Provider store={store}>
    <CommonContext>
      <Router basename={basePath} history={history}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </Router>
    </CommonContext>
  </Provider>,
  document.getElementById('root')
)
