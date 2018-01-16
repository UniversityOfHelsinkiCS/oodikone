import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Header from '../Header';
import Populations from '../Populations';
import DepartmentSuccess from '../DepartmentSuccess';
import StudentStatistics from '../StudentStatistics';
import { routes, BASE_PATH } from '../../constants';

import styles from './main.css';

const Main = () =>
  (
    <div className={styles.appContainer}>
      <Header />
      <Router basename={BASE_PATH}>
        <main className={styles.routeViewContainer}>
          <Switch>
            <Route exact path={routes.index} component={DepartmentSuccess} />
            <Route exact path={routes.populations} component={Populations} />
            <Route exact path={routes.students} component={StudentStatistics} />
          </Switch>
        </main>
      </Router>
    </div>
  );

export default Main;

