import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { localize } from 'react-localize-redux';

import Header from '../Header';
import Populations from '../PopulationStatistics';
import DepartmentSuccess from '../DepartmentSuccess';
import StudentStatistics from '../StudentStatistics';
import Courses from '../Courses';
import Teachers from '../Teachers';
import ErrorContainer from '../ErrorContainer';
import { routes, BASE_PATH } from '../../constants';

import styles from './main.css';

const Main = () => (
  <div className={styles.appContainer}>
    <Router basename={BASE_PATH}>
      <main className={styles.routeViewContainer}>
        <Header />
        <ErrorContainer />
        <Switch>
          <Route exact path={routes.index.route} component={DepartmentSuccess} />
          <Route exact path={routes.populations.route} component={Populations} />
          <Route exact path={routes.students.route} component={StudentStatistics} />
          <Route exact path={routes.courses.route} component={Courses} />
          <Route exact path={routes.teachers.route} component={Teachers} />
        </Switch>
      </main>
    </Router>
  </div>
);

export default localize(Main, 'locale');

