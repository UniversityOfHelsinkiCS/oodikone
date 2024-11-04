import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import 'semantic-ui-css/semantic.min.css'
import 'react-datetime/css/react-datetime.css'
import './styles/custom.css'
import { App } from './components/App'
import { CommonContext } from './components/common/CommonContext'
import { ConnectedErrorBoundary as ErrorBoundary } from './components/ErrorBoundary'
import { basePath } from './conf'
import { store } from './redux'
import { initializeSentry } from './util/sentry'

initializeSentry()

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <CommonContext>
      <BrowserRouter basename={basePath}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </CommonContext>
  </Provider>
)
