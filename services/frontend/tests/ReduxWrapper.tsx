import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router'
import { Layout } from '@/components/App'
import { store } from '@/redux'

export const ReduxWrapper = ({ component }: { component: React.JSX.Element }) => {
  return (
    <Provider store={store}>
      <BrowserRouter basename={''}>
        <Layout>{component}</Layout>
      </BrowserRouter>
    </Provider>
  )
}
