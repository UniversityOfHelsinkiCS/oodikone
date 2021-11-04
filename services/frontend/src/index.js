import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import 'semantic-ui-css/semantic.min.css'
import 'react-datetime/css/react-datetime.css'
import './styles/custom.css'
import store from './redux'
import ErrorBoundary from './components/ErrorBoundary'
import Main from './components/Main'
import CommonContext from './CommonContext'
import initializeSentry from './util/sentry'

initializeSentry()

ReactDOM.render(
  <Provider store={store}>
    <CommonContext>
      <ErrorBoundary>
        <Main />
      </ErrorBoundary>
    </CommonContext>
  </Provider>,
  document.getElementById('root')
)
