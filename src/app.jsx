import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import promiseMiddleware from 'redux-promise-middleware';
import logger from 'redux-logger';

import 'semantic-ui-css/semantic.min.css';
import './styles/global';

import reducers from './reducers';
import Main from './components/Main';

const reduxMiddlewares = [promiseMiddleware()];

if (process.env.NODE_ENV === 'development') {
  reduxMiddlewares.push(logger);
}

const store = createStore(reducers, applyMiddleware(...reduxMiddlewares));

const render = (Component) => {
  ReactDOM.render(
    <Provider store={store}>
      <AppContainer>
        <Component />
      </AppContainer>
    </Provider>,
    document.getElementById('root')
  );
};

render(Main);

if (module.hot) {
  module.hot.accept('./components/Main', () => {
    render(Main);
  });
}

