import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import promiseMiddleware from 'redux-promise-middleware';
import logger from 'redux-logger';
import { initialize, addTranslation } from 'react-localize-redux';

import 'semantic-ui-css/semantic.min.css';
import 'react-datetime/css/react-datetime.css';
import './styles/global';

import { AVAILABLE_LANGUAGES, DEFAULT_LANG } from './constants';
import reducers from './reducers';
import Main from './components/Main';

const reduxMiddlewares = [promiseMiddleware()];

if (process.env.NODE_ENV === 'development') {
  reduxMiddlewares.push(logger);
}

const translations = require('./i18n/translations.json');

const store = createStore(reducers, applyMiddleware(...reduxMiddlewares));

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

