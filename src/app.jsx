import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
import promiseMiddleware from 'redux-promise-middleware';
import logger from 'redux-logger';
import { initialize, addTranslation } from 'react-localize-redux';
import thunk from 'redux-thunk';

import 'semantic-ui-css/semantic.min.css';
import 'react-datetime/css/react-datetime.css';
import './styles/global';

import { AVAILABLE_LANGUAGES, DEFAULT_LANG } from './constants';
import reducers from './reducers';
import { handleRequest } from './apiConnection';
import Main from './components/Main';

const reduxMiddlewares = [promiseMiddleware()];

if (process.env.NODE_ENV === 'development') {
  reduxMiddlewares.push(logger);
  reduxMiddlewares.push(thunk);
  reduxMiddlewares.push(handleRequest);
}

const translations = require('./i18n/translations.json');

// eslint-disable-next-line
const composeEnhancers = (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

const store = createStore(reducers, composeEnhancers(applyMiddleware(...reduxMiddlewares)));
store.dispatch(initialize(AVAILABLE_LANGUAGES, { defaultLanguage: DEFAULT_LANG }));
store.dispatch(addTranslation(translations));


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

