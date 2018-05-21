import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { localize } from 'react-localize-redux'
import { Loader } from 'semantic-ui-react'

import Header from '../Header'
import Populations from '../PopulationStatistics'
import DepartmentSuccess from '../DepartmentSuccess'
import StudentStatistics from '../StudentStatistics'
import CourseInstances from '../CourseInstances'
import CourseStatistics from '../CourseStatistics'
import EnableUsers from '../EnableUsers'
import ErrorContainer from '../ErrorContainer'
import { routes, BASE_PATH } from '../../constants'
import AccessDenied from '../AccessDenied'

import styles from './main.css'

import { userIsEnabled, log } from '../../common'

class Main extends Component {
  state = {
    enabled: false,
    hasError: false,
    loaded: false
  }

  async componentDidMount() {
    const enabled = await userIsEnabled()
    if (!enabled) {
      log('Not enabled')
    }
    this.setState({ enabled, loaded: true })
  }

  componentDidCatch() {
    this.setState({ hasError: true, loaded: true })
  }

  render() {
    if (!this.state.loaded) {
      return <Loader active inline="centered" />
    }
    if (!this.state.enabled || this.state.hasError) {
      return <AccessDenied itWasError={this.state.hasError} />
    }
    return (
      <div className={styles.appContainer}>
        <Router basename={BASE_PATH}>
          <main className={styles.routeViewContainer}>
            <Header />
            <ErrorContainer />
            <Switch>
              <Route exact path={routes.index.route} component={DepartmentSuccess} />
              <Route exact path={routes.populations.route} component={Populations} />
              <Route exact path={routes.students.route} component={StudentStatistics} />
              <Route exact path={routes.courseInstances.route} component={CourseInstances} />
              <Route exact path={routes.courseStatistics.route} component={CourseStatistics} />
              <Route exact path={routes.users.route} component={EnableUsers} />
            </Switch>
          </main>
        </Router>
      </div>
    )
  }
}

export default localize(Main, 'locale')

