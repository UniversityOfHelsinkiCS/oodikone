import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Header from '../Header';
import Populations from '../Populations';
import { routes } from '../../constants';

import styles from './main.css';

/* TODO: set this configurable? */
const BASE_PATH = '/';

const Main = () =>
    <div className={styles.appContainer}>
       <Header />
       <Router basename={BASE_PATH}>
           <main className={styles.routeViewContainer}>
            <Switch>
                <Route exact path={routes.populations} component={Populations} />
             </Switch>
           </main>
       </Router>
    </div>;

export default Main;

