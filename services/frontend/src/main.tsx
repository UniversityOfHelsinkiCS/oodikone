// eslint-disable-next-line import-x/no-unused-modules
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router'

import './styles/custom.css'
import { Layout, App } from './components/App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { basePath } from './conf'
import { store } from './redux'
import { initializeSentry } from './util/sentry'

initializeSentry()

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <BrowserRouter basename={basePath}>
      <ErrorBoundary>
        <Layout>
          <App />
        </Layout>
      </ErrorBoundary>
    </BrowserRouter>
  </Provider>
)
